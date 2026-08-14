import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./storage.js";
import { v4 as uuidv4 } from "uuid";
import { log } from "./vite.js";
import {
  validateRoomId,
  validateUsername,
  validateGameMove,
  rateLimiter,
  checkSocketRateLimit
} from "./security.js";
import {
  Board,
  Player,
  PieceType,
  PlayerInventory,
  GamePhase,
  GameResult,
  Position,
  Cell,
  WinningLine,
} from "./types.js";
import {
  createEmptyBoard,
  createInitialInventory,
  isValidMove,
  checkWin,
  checkDraw,
  findWinningLine,
} from "./gameUtils.js";

// サーバーの起動時間を記録
const SERVER_START_TIME = new Date();
const SERVER_VERSION = '1.0.1';
let SERVER_UPTIME = 0;

// 1分ごとにアップタイムを更新
setInterval(() => {
  const now = new Date();
  SERVER_UPTIME = Math.floor((now.getTime() - SERVER_START_TIME.getTime()) / 1000);
}, 60000);

// 初期値を設定
SERVER_UPTIME = 0;

interface GameState {
  board: Board;
  player1Inventory: PlayerInventory;
  player2Inventory: PlayerInventory;
  currentPlayer: Player;
  currentTurn: number;
  gamePhase: GamePhase;
  gameResult: GameResult;
  lastMove?: { player: Player; piece: PieceType; position: Position } | null;
  winningLine?: WinningLine | null;
}

interface GameRoom {
  id: string;
  players: {
    [socketId: string]: {
      username: string;
      ready: boolean;
      playerNumber: 1 | 2 | null;
      disconnectedAt?: number; // 対局中に切断された場合のタイムスタンプ（再接続猶予中）
    }
  };
  gameState: GameState | null;
  inProgress: boolean;
  spectators: string[];
  createdAt: number;
  lastActivity: number;
  pendingDeletion?: number; // タイムスタンプ
}

const gameRooms: { [roomId: string]: GameRoom } = {};

let waitingUsers: { socketId: string, username: string }[] = [];

// ルーム管理設定
const ROOM_EMPTY_TIMEOUT = 5 * 60 * 1000; // 5分間空のルームを保持
const ROOM_CLEANUP_INTERVAL = 60 * 1000; // 1分ごとにクリーンアップチェック
const ROOM_MAX_LIFETIME = 24 * 60 * 60 * 1000; // 24時間で自動削除
const DISCONNECT_GRACE_PERIOD = 60 * 1000; // 対局中に切断してから再接続できる猶予
const ROOM_INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 進行中でないルームの非アクティブ削除まで

// ルームの最終活動時間を更新する関数
function updateRoomActivity(roomId: string) {
  if (gameRooms[roomId]) {
    gameRooms[roomId].lastActivity = Date.now();
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // ヘルスチェックエンドポイント
  app.get('/api/health', (req, res) => {
    try {
      // 最新のアップタイムを計算（常に最新の値を取得するため）
      const now = new Date();
      const currentUptime = Math.floor((now.getTime() - SERVER_START_TIME.getTime()) / 1000);
      
      res.json({
        status: 'ok',
        version: SERVER_VERSION,
        uptime: currentUptime,
        startTime: SERVER_START_TIME.toISOString(),
        env: process.env.NODE_ENV || 'development'
      });
    } catch (error) {
      // エラーが発生した場合は基本的な情報だけを返す
      log(`Health check error: ${error instanceof Error ? error.message : String(error)}`);
      res.status(200).json({
        status: 'degraded',
        version: SERVER_VERSION,
        message: 'Health check encountered an error but service is running'
      });
    }
  });

  app.get('/api/game-rooms', (req, res) => {
    const availableRooms = Object.entries(gameRooms)
      .filter(([_, room]) => !room.inProgress)
      .map(([id, room]) => ({
        id,
        playerCount: Object.keys(room.players).length,
        players: Object.values(room.players).map(p => p.username)
      }));
    
    res.json({ rooms: availableRooms });
  });

  const httpServer = createServer(app);

  // Express層(index.ts)と同じオリジン許可リストをSocket.IO層にも適用する
  const socketAllowedOrigins = process.env.NODE_ENV === 'production'
    ? ['https://jankenwars.onrender.com']
    : ['http://localhost:5173', 'http://localhost:5000'];

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: socketAllowedOrigins,
      methods: ["GET", "POST"]
    }
  });

  // ルームクリーンアップ処理（1分ごと）。
  // 進行中のルームは非アクティブ時間だけでは削除しない。切断猶予(DISCONNECT_GRACE_PERIOD)を
  // 過ぎたプレイヤーのみここで退室させ、残り1人になった場合はその人を勝者として対局を終了する。
  setInterval(() => {
    const now = Date.now();

    Object.entries(gameRooms).forEach(([roomId, room]) => {
      const roomAge = now - room.createdAt;

      // 24時間経過したルームは無条件で削除
      if (roomAge > ROOM_MAX_LIFETIME) {
        delete gameRooms[roomId];
        log(`Room ${roomId} deleted (exceeded max lifetime)`);
        return;
      }

      // 対局中に切断されたまま猶予期間を超えたプレイヤーを退室させる。
      // 期限切れのプレイヤーを先に全員洗い出してから一括削除する（両者が同時に
      // 期限切れになった場合に、直後に削除されるはずの相手を勝者にしてしまう
      // 状態不整合を避けるため、削除を1件ずつ行いながら判定してはならない）。
      if (room.inProgress) {
        const expiredSocketIds = Object.entries(room.players)
          .filter(([, data]) => data.disconnectedAt !== undefined && now - data.disconnectedAt! > DISCONNECT_GRACE_PERIOD)
          .map(([socketId]) => socketId);

        if (expiredSocketIds.length > 0) {
          for (const socketId of expiredSocketIds) {
            delete room.players[socketId];
            log(`Room ${roomId}: player ${socketId} removed after disconnect grace period`);
          }

          const remainingEntries = Object.entries(room.players);
          if (remainingEntries.length === 1 && room.gameState && room.gameState.gameResult === GameResult.ONGOING) {
            const [, winnerData] = remainingEntries[0];
            room.gameState.gamePhase = GamePhase.GAME_OVER;
            room.gameState.gameResult = winnerData.playerNumber === 1 ? GameResult.PLAYER1_WIN : GameResult.PLAYER2_WIN;
            room.inProgress = false;

            io.to(roomId).emit("game:state:update", {
              gameState: room.gameState,
              moveDetails: null
            });
          }

          io.to(roomId).emit("player:left", {
            playerId: expiredSocketIds[0],
            players: Object.entries(room.players).map(([id, data]) => ({
              id,
              username: data.username,
              playerNumber: data.playerNumber,
              ready: data.ready
            }))
          });
        }
      }

      const playerCount = Object.keys(room.players).length;

      // 空のルームで削除待ちの処理
      if (playerCount === 0) {
        if (!room.pendingDeletion) {
          room.pendingDeletion = now + ROOM_EMPTY_TIMEOUT;
          log(`Room ${roomId} marked for deletion in 5 minutes`);
        } else if (now >= room.pendingDeletion) {
          delete gameRooms[roomId];
          log(`Room ${roomId} deleted (empty timeout)`);
        }
        return;
      } else if (room.pendingDeletion) {
        // プレイヤーが戻ってきた場合、削除予定をキャンセル
        delete room.pendingDeletion;
        log(`Room ${roomId} deletion cancelled (player returned)`);
      }

      // 進行中でないルームのみ、非アクティブ時間で削除する（対局中は削除しない）
      if (!room.inProgress) {
        const inactiveTime = now - room.lastActivity;
        if (inactiveTime > ROOM_INACTIVITY_TIMEOUT) {
          delete gameRooms[roomId];
          log(`Room ${roomId} deleted (inactive timeout)`);
        }
      }
    });

    // マッチメイキングキューの異常な滞留をクリーンアップ
    if (waitingUsers.length > 10) {
      log(`Clearing oversized matchmaking queue`);
      waitingUsers.length = 0;
    }
  }, ROOM_CLEANUP_INTERVAL);

  io.on("connection", (socket) => {
    log(`New client connected: ${socket.id}`);

    // 全イベント共通のレート制限（ソケット単位、1分間60イベントまで）
    socket.use((_packet, next) => {
      const key = socket.handshake.address || socket.id;
      if (!checkSocketRateLimit(key)) {
        socket.emit("game:error", { message: "Too many requests. Please slow down." });
        return;
      }
      next();
    });

    socket.on("user:join", (username: string) => {
      // ユーザー名の検証
      if (!username || !validateUsername(username)) {
        socket.emit("game:error", { message: "Invalid username." });
        return;
      }
      
      log(`User joined: ${username} (${socket.id})`);
      socket.data.username = username;
    });
    
    socket.on("room:create", () => {
      try {
        const roomId = uuidv4().substring(0, 8);
        const username = socket.data.username || "Anonymous";
        
        const now = Date.now();
        gameRooms[roomId] = {
          id: roomId,
          players: {
            [socket.id]: {
              username,
              ready: false,
              playerNumber: 1
            }
          },
          gameState: null,
          inProgress: false,
          spectators: [],
          createdAt: now,
          lastActivity: now
        };
        
        socket.join(roomId);
        
        socket.emit("room:created", {
          roomId,
          players: [{
            id: socket.id,
            username,
            playerNumber: 1,
            ready: false
          }]
        });
        
        log(`Room created: ${roomId} by ${username}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log(`Error creating room for socket ${socket.id}: ${errorMessage}`);
        console.error("Full error details:", error);
        socket.emit("game:error", { message: "Failed to create room due to server error." });
      }
    });
    
    socket.on("room:join", (roomId: string) => {
      // ルームIDの検証
      if (!roomId || !validateRoomId(roomId)) {
        socket.emit("game:error", { message: "Invalid room ID" });
        return;
      }
      
      log(`Received room:join request for roomId: ${roomId}`);
      log(`Current gameRooms: ${JSON.stringify(Object.keys(gameRooms))}`);
      const room = gameRooms[roomId];
      log(`Found room? ${!!room}`);

      const username = socket.data.username || "Anonymous";
      
      if (!room) {
        log(`Room ${roomId} not found.`);
        socket.emit("game:error", { message: "Room not found" });
        return;
      }
      
      // ルームの活動時間を更新
      updateRoomActivity(roomId);

      // 対局中に切断していた同一ユーザー名のプレイヤーがいれば、観戦者化する前に再接続として扱う
      const disconnectedPlayerEntry = Object.entries(room.players).find(([, data]) =>
        data.username === username && data.disconnectedAt !== undefined
      );

      if (disconnectedPlayerEntry) {
        const [oldSocketId, playerData] = disconnectedPlayerEntry;
        delete room.players[oldSocketId];
        delete playerData.disconnectedAt;
        room.players[socket.id] = playerData;

        socket.join(roomId);

        const roomDataForReconnecting = {
          roomId,
          players: Object.entries(room.players).map(([id, data]) => ({
            id,
            username: data.username,
            playerNumber: data.playerNumber as 1 | 2,
            ready: data.ready
          }))
        };

        socket.emit("room:joined", roomDataForReconnecting);
        socket.to(roomId).emit("room:player:joined", roomDataForReconnecting);

        if (room.inProgress && room.gameState) {
          socket.emit("game:state:update", {
            gameState: room.gameState,
            moveDetails: null
          });
        }

        log(`Player reconnected during game: ${username} rejoined ${roomId} with new socket ${socket.id}`);
        return;
      }

      if (room.inProgress) {
        room.spectators.push(socket.id);
        socket.join(roomId);
        socket.emit("room:joined:spectator", {
          roomId,
          players: Object.entries(room.players).map(([id, data]) => ({
            id,
            username: data.username,
            playerNumber: data.playerNumber,
            ready: data.ready
          }))
        });

        // 進行中のゲームの状態を送信
        if (room.gameState) {
          socket.emit("game:state:update", {
            gameState: room.gameState,
            moveDetails: null // 初回同期時は移動詳細なし
          });
        }
        return;
      }

      const playerCount = Object.keys(room.players).length;
      
      // 既存のプレイヤーが再接続しようとしているかチェック
      // 同じユーザー名で、かつそのソケットが切断されている（存在しない）場合のみ再接続とみなす
      const existingPlayerEntry = Object.entries(room.players).find(([socketId, data]) => 
        data.username === username && !io.sockets.sockets.has(socketId)
      );
      
      if (existingPlayerEntry && playerCount <= 2) {
        // 既存プレイヤーの再接続 - socket IDを更新
        const [oldSocketId, playerData] = existingPlayerEntry;
        delete room.players[oldSocketId];
        room.players[socket.id] = playerData;
        
        socket.join(roomId);
        
        const roomDataForRejoining = {
          roomId,
          players: Object.entries(room.players).map(([id, data]) => ({
            id,
            username: data.username,
            playerNumber: data.playerNumber as 1 | 2,
            ready: data.ready
          }))
        };
        
        socket.emit("room:joined", roomDataForRejoining);
        socket.to(roomId).emit("room:player:joined", roomDataForRejoining);
        
        // 進行中のゲームがあれば状態を同期
        if (room.inProgress && room.gameState) {
          socket.emit("game:state:update", {
            gameState: room.gameState,
            moveDetails: null
          });
        }
        
        log(`Player rejoined room: ${username} rejoined ${roomId} with new socket ${socket.id}`);
      } else if (playerCount >= 2) {
        room.spectators.push(socket.id);
        socket.join(roomId);
        socket.emit("room:joined:spectator", {
          roomId,
          players: Object.entries(room.players).map(([id, data]) => ({
            id,
            username: data.username,
            playerNumber: data.playerNumber,
            ready: data.ready
          }))
        });
        
        // 進行中のゲームの状態を観戦者にも送信
        if (room.inProgress && room.gameState) {
          socket.emit("game:state:update", {
            gameState: room.gameState,
            moveDetails: null
          });
        }
      } else {
        room.players[socket.id] = {
          username,
          ready: false,
          playerNumber: 2
        };
        
        socket.join(roomId);
        
        const roomDataForJoiner = {
          roomId,
          players: Object.entries(room.players).map(([id, data]) => ({
            id,
            username: data.username,
            playerNumber: data.playerNumber as 1 | 2,
            ready: data.ready
          }))
        };
        socket.emit("room:joined", roomDataForJoiner);
        
        socket.to(roomId).emit("room:player:joined", roomDataForJoiner);
        
        log(`Player joined room: ${username} joined ${roomId}`);
      }
    });
    
    socket.on("player:ready", (roomId: string) => {
      if (!roomId || !validateRoomId(roomId)) {
        socket.emit("game:error", { message: "Invalid room ID" });
        return;
      }

      const room = gameRooms[roomId];

      if (!room || !room.players[socket.id]) {
        return;
      }
      
      updateRoomActivity(roomId);
      
      room.players[socket.id].ready = !room.players[socket.id].ready;
      
      io.to(roomId).emit("room:player:ready", {
        playerId: socket.id,
        ready: room.players[socket.id].ready,
        players: Object.entries(room.players).map(([id, data]) => ({
          id,
          username: data.username,
          playerNumber: data.playerNumber,
          ready: data.ready
        }))
      });
      
      const allReady = Object.values(room.players).every(p => p.ready);
      const playerCount = Object.keys(room.players).length;
      
      log(`Room ${roomId}: playerCount=${playerCount}, allReady=${allReady}, inProgress=${room.inProgress}`);
      log(`Players ready status: ${JSON.stringify(Object.entries(room.players).map(([id, data]) => ({id: id.substring(0,8), username: data.username, ready: data.ready})))}`);
      
      if (allReady && playerCount === 2 && !room.inProgress) {
        room.inProgress = true;
        room.gameState = {
          board: createEmptyBoard(),
          player1Inventory: createInitialInventory(),
          player2Inventory: createInitialInventory(),
          currentPlayer: Player.PLAYER1,
          currentTurn: 1,
          gamePhase: GamePhase.SELECTING_CELL,
          gameResult: GameResult.ONGOING,
          lastMove: null,
          winningLine: null,
        };

        io.to(roomId).emit("game:start", {
          roomId,
          players: Object.entries(room.players).map(([id, data]) => ({
            id,
            username: data.username,
            playerNumber: data.playerNumber,
            ready: data.ready
          })),
          gameState: room.gameState
        });
        log(`Game started in room ${roomId} with ${playerCount} players`);
        log(`Players with numbers: ${JSON.stringify(Object.entries(room.players).map(([id, data]) => ({id: id.substring(0,8), username: data.username, playerNumber: data.playerNumber})))}`);
      }
    });
    
    socket.on("game:move", (data: { roomId: string, position: Position, piece: PieceType }) => {
      const { roomId, position, piece } = data;
      
      // 入力検証
      if (!validateRoomId(roomId)) {
        socket.emit("game:error", { message: "Invalid room ID" });
        return;
      }
      
      updateRoomActivity(roomId);
      
      if (!validateGameMove(position, piece)) {
        socket.emit("game:error", { message: "Invalid move data" });
        return;
      }
      
      const room = gameRooms[roomId];
      
      if (!room) {
        socket.emit("game:error", { message: "Room not found" });
        return;
      }
      
      if (!room.inProgress || !room.gameState) {
        socket.emit("game:error", { message: "Game not in progress" });
        return;
      }

      if (room.gameState.gamePhase === GamePhase.GAME_OVER || room.gameState.gameResult !== GameResult.ONGOING) {
        socket.emit("game:error", { message: "Game has already ended" });
        return;
      }

      const gameState = room.gameState;
      const playerSocketId = socket.id;
      const playerInfo = room.players[playerSocketId];
      
      if (!playerInfo) {
        socket.emit("game:error", { message: "Player not in room" });
        return;
      }
      
      const isPlayer1 = playerInfo.playerNumber === 1;
      const isPlayer2 = playerInfo.playerNumber === 2;
      const currentPlayer = gameState.currentPlayer || (gameState.currentTurn === 1 ? Player.PLAYER1 : Player.PLAYER2);
      
      if ((isPlayer1 && currentPlayer !== Player.PLAYER1) || (isPlayer2 && currentPlayer !== Player.PLAYER2)) {
        socket.emit("game:error", { message: "Not your turn" });
        return;
      }

      // Check if valid move
      if (!isValidMove(gameState.board, position, piece, currentPlayer)) {
        socket.emit("game:error", { message: "Invalid move" });
        return;
      }
      
      // Check if piece is in inventory
      const playerInventory = currentPlayer === Player.PLAYER1 ? gameState.player1Inventory : gameState.player2Inventory;
      if (playerInventory[piece] <= 0) {
        socket.emit("game:error", { message: "Piece not in inventory" });
        return;
      }
      
      // Deep clone the board
      const newBoard = JSON.parse(JSON.stringify(gameState.board));
      const { row, col } = position;
      const targetCell = newBoard[row][col];
      
      // Keep track of captured piece for animation
      const oldPiece = targetCell.piece;
      const justCaptured = oldPiece !== PieceType.EMPTY;
      const justUsed = justCaptured && oldPiece !== piece;
      
      // Update the inventory
      playerInventory[piece]--;
      
      // Place the piece
      if (targetCell.piece === PieceType.EMPTY) {
        targetCell.piece = piece;
        targetCell.owner = currentPlayer;
      } else {
        // This is a capture
        targetCell.piece = piece;
        targetCell.owner = currentPlayer;
        targetCell.hasBeenUsed = true;
      }
      
      // Check for win
      const winLine = findWinningLine(newBoard, currentPlayer);
      if (winLine) {
        gameState.gamePhase = GamePhase.GAME_OVER;
        gameState.gameResult = currentPlayer === Player.PLAYER1 ? GameResult.PLAYER1_WIN : GameResult.PLAYER2_WIN;
        gameState.winningLine = winLine;
      } else if (checkDraw(newBoard, gameState.player1Inventory, gameState.player2Inventory)) {
        gameState.gamePhase = GamePhase.GAME_OVER;
        gameState.gameResult = GameResult.DRAW;
        gameState.winningLine = null;
      } else {
        // Switch turn
        gameState.currentPlayer = currentPlayer === Player.PLAYER1 ? Player.PLAYER2 : Player.PLAYER1;
        gameState.currentTurn = gameState.currentTurn === 1 ? 2 : 1;
      }
      
      // Update the game state
      gameState.board = newBoard;
      gameState.lastMove = {
        player: currentPlayer,
        piece,
        position
      };
      
      // Emit game state update
      io.to(roomId).emit("game:state:update", {
        gameState,
        moveDetails: {
          player: currentPlayer,
          piece,
          position,
          capturedPiece: justCaptured ? oldPiece : null,
          hasBeenUsed: justUsed
        }
      });

      log(`Game state updated for room ${roomId}. Turn: ${gameState.currentPlayer}`);
    });
    
    socket.on("game:request_rematch", (roomId: string) => {
      if (!roomId || !validateRoomId(roomId)) {
        socket.emit("game:error", { message: "Invalid room ID" });
        return;
      }

      const room = gameRooms[roomId];
      const playerSocketId = socket.id;

      log(`[game:request_rematch] Received from ${playerSocketId} for room ${roomId}`);

      if (!room) {
        log(`[game:request_rematch] Room ${roomId} not found.`);
        socket.emit("game:error", { message: "Room not found for rematch request." });
        return;
      }

      updateRoomActivity(roomId);

      if (!room.players[playerSocketId]) {
        log(`[game:request_rematch] Player ${playerSocketId} not in room ${roomId}.`);
        socket.emit("game:error", { message: "You are not in this room." });
        return;
      }

      // 対局が決着していない状態での一方的なリセットを禁止する
      if (room.inProgress && room.gameState && room.gameState.gameResult === GameResult.ONGOING) {
        log(`[game:request_rematch] Rejected: game still ongoing in room ${roomId}.`);
        socket.emit("game:error", { message: "Cannot request rematch while the game is still in progress." });
        return;
      }

      room.inProgress = false;
      room.gameState = {
        board: createEmptyBoard(),
        player1Inventory: createInitialInventory(),
        player2Inventory: createInitialInventory(),
        currentPlayer: Player.PLAYER1,
        currentTurn: 1,
        gamePhase: GamePhase.READY,
        gameResult: GameResult.ONGOING,
        lastMove: null,
        winningLine: null,
      };

      for (const id in room.players) {
        room.players[id].ready = false;
      }

      log(`[game:request_rematch] Game reset for room ${roomId}. Waiting for players to be ready.`);

      io.to(roomId).emit("game:rematch:initiated", { 
        roomId,
        players: Object.entries(room.players).map(([id, data]) => ({
          id,
          username: data.username,
          playerNumber: data.playerNumber,
          ready: data.ready 
        })),
        gameState: room.gameState 
      });
    });
    
    socket.on("room:leave", (roomId: string) => {
      if (!roomId || !validateRoomId(roomId)) {
        socket.emit("game:error", { message: "Invalid room ID" });
        return;
      }

      const room = gameRooms[roomId];
      const playerSocketId = socket.id;

      if (room && room.players[playerSocketId]) {
        const username = room.players[playerSocketId].username;
        log(`Player leaving room: ${username} (${playerSocketId}) is leaving room ${roomId}`);

        delete room.players[playerSocketId];
        socket.leave(roomId);

        socket.emit("room:left:success");

        const remainingPlayers = Object.keys(room.players).length;

        if (remainingPlayers === 0) {
          // 即座に削除せず、タイムアウト設定
          if (!room.pendingDeletion) {
            room.pendingDeletion = Date.now() + ROOM_EMPTY_TIMEOUT;
            log(`Room ${roomId} marked for deletion (became empty)`);
          }
        } else {
          io.to(roomId).emit("player:left", {
            playerId: playerSocketId,
            players: Object.entries(room.players).map(([id, data]) => ({
              id,
              username: data.username,
              playerNumber: data.playerNumber,
              ready: data.ready
            }))
          });
          log(`Notified remaining players in room ${roomId} about ${username} leaving.`);
          
          if (room.inProgress) {
             log(`Player left during an ongoing game in room ${roomId}. Game state might need reset.`);
             room.inProgress = false;
             room.gameState = null;
             io.to(roomId).emit("game:force:end", { message: "Opponent left the game." }); 
          }
        }
      } else {
        log(`Player ${playerSocketId} attempted to leave room ${roomId}, but was not found in the room.`);
      }
    });
    
    socket.on("matchmaking:join", () => {
      const username = socket.data.username || "Anonymous";

      // 同一ソケットの多重登録を防ぐ（連打・再送によるキュー汚染対策）
      if (waitingUsers.some(u => u.socketId === socket.id)) {
        socket.emit("matchmaking:waiting");
        return;
      }

      waitingUsers.push({
        socketId: socket.id,
        username
      });
      
      log(`User ${username} joined matchmaking queue`);
      
      if (waitingUsers.length >= 2) {
        const player1 = waitingUsers.shift()!;
        const player2 = waitingUsers.shift()!;
        
        const roomId = uuidv4().substring(0, 8);
        
        const now = Date.now();
        gameRooms[roomId] = {
          id: roomId,
          players: {
            [player1.socketId]: {
              username: player1.username,
              ready: true,
              playerNumber: 1
            },
            [player2.socketId]: {
              username: player2.username,
              ready: true,
              playerNumber: 2
            }
          },
          gameState: null,
          inProgress: false,
          spectators: [],
          createdAt: now,
          lastActivity: now
        };
        
        io.sockets.sockets.get(player1.socketId)?.join(roomId);
        io.sockets.sockets.get(player2.socketId)?.join(roomId);
        
        io.to(roomId).emit("matchmaking:matched", {
          roomId,
          players: [
            {
              id: player1.socketId,
              username: player1.username,
              playerNumber: 1,
              ready: true
            },
            {
              id: player2.socketId,
              username: player2.username,
              playerNumber: 2,
              ready: true
            }
          ]
        });
        
        log(`Matched players: ${player1.username} and ${player2.username} in room ${roomId}`);
      } else {
        socket.emit("matchmaking:waiting");
      }
    });
    
    socket.on("matchmaking:cancel", () => {
      waitingUsers = waitingUsers.filter(u => u.socketId !== socket.id);
      socket.emit("matchmaking:cancelled");
    });
    
    socket.on("disconnect", () => {
      waitingUsers = waitingUsers.filter(u => u.socketId !== socket.id);
      
      for (const roomId in gameRooms) {
        const room = gameRooms[roomId];
        
        if (room.players[socket.id]) {
          if (room.inProgress) {
            // 対局中の切断は即削除せず、再接続の猶予(DISCONNECT_GRACE_PERIOD)を与える。
            // 猶予切れの処理はクリーンアップループが担当する。
            room.players[socket.id].disconnectedAt = Date.now();
            io.to(roomId).emit("player:disconnected", {
              playerId: socket.id,
              players: Object.entries(room.players).map(([id, data]) => ({
                id,
                username: data.username,
                playerNumber: data.playerNumber,
                ready: data.ready
              }))
            });
            log(`Player ${socket.id} disconnected during game in room ${roomId}, waiting for reconnection`);
          } else {
            delete room.players[socket.id];

            if (Object.keys(room.players).length === 0) {
              // 即座に削除せず、タイムアウト設定
              if (!room.pendingDeletion) {
                room.pendingDeletion = Date.now() + ROOM_EMPTY_TIMEOUT;
                log(`Room ${roomId} marked for deletion after disconnect`);
              }
            } else {
              io.to(roomId).emit("player:left", {
                playerId: socket.id,
                players: Object.entries(room.players).map(([id, data]) => ({
                  id,
                  username: data.username,
                  playerNumber: data.playerNumber,
                  ready: data.ready
                }))
              });
            }
          }
        }
        
        const spectatorIndex = room.spectators.indexOf(socket.id);
        if (spectatorIndex !== -1) {
          room.spectators.splice(spectatorIndex, 1);
        }
      }
      
      log(`Client disconnected: ${socket.id}`);
    });
  });

  return httpServer;
}