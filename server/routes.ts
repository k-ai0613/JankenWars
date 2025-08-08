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
  rateLimiter
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

// 5分ごとに古いルームをクリーンアップ
setInterval(() => {
  const now = Date.now();
  const ROOM_TIMEOUT = 30 * 60 * 1000; // 30分間非アクティブなルームを削除
  
  Object.keys(gameRooms).forEach(roomId => {
    const room = gameRooms[roomId];
    if (room && now - room.lastActivity > ROOM_TIMEOUT) {
      console.log(`[CLEANUP] Removing inactive room: ${roomId}`);
      delete gameRooms[roomId];
    }
  });
  
  // マッチメイキングキューもクリーンアップ
  if (waitingUsers.length > 10) {
    console.log(`[CLEANUP] Clearing oversized matchmaking queue`);
    waitingUsers.length = 0;
  }
  
  console.log(`[CLEANUP] Active rooms: ${Object.keys(gameRooms).length}, Matchmaking queue: ${waitingUsers.length}`);
}, 5 * 60 * 1000);

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

// ルームクリーンアップ処理
setInterval(() => {
  const now = Date.now();
  Object.entries(gameRooms).forEach(([roomId, room]) => {
    const playerCount = Object.keys(room.players).length;
    const roomAge = now - room.createdAt;
    const inactiveTime = now - room.lastActivity;
    
    // 24時間経過したルームを削除
    if (roomAge > ROOM_MAX_LIFETIME) {
      delete gameRooms[roomId];
      log(`Room ${roomId} deleted (exceeded max lifetime)`);
      return;
    }
    
    // 空のルームで削除待ちの処理
    if (playerCount === 0) {
      if (!room.pendingDeletion) {
        room.pendingDeletion = now + ROOM_EMPTY_TIMEOUT;
        log(`Room ${roomId} marked for deletion in 5 minutes`);
      } else if (now >= room.pendingDeletion) {
        delete gameRooms[roomId];
        log(`Room ${roomId} deleted (empty timeout)`);
      }
    } else {
      // プレイヤーが戻ってきた場合、削除予定をキャンセル
      if (room.pendingDeletion) {
        delete room.pendingDeletion;
        log(`Room ${roomId} deletion cancelled (player returned)`);
      }
    }
  });
}, ROOM_CLEANUP_INTERVAL);

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
  
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    log(`New client connected: ${socket.id}`);
    
    socket.on("user:join", (username: string) => {
      // ユーザー名の検証
      if (!username || !validateUsername(username)) {
        socket.emit("error", { message: "Invalid username. Use 3-20 alphanumeric characters." });
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
        socket.emit("error", { message: "Failed to create room due to server error." });
      }
    });
    
    socket.on("room:join", (roomId: string) => {
      // ルームIDの検証
      if (!roomId || !validateRoomId(roomId)) {
        socket.emit("error", { message: "Invalid room ID" });
        return;
      }
      
      log(`Received room:join request for roomId: ${roomId}`);
      log(`Current gameRooms: ${JSON.stringify(Object.keys(gameRooms))}`);
      const room = gameRooms[roomId];
      log(`Found room? ${!!room}`);

      const username = socket.data.username || "Anonymous";
      
      if (!room) {
        log(`Room ${roomId} not found.`);
        socket.emit("error", { message: "Room not found" });
        return;
      }
      
      // ルームの活動時間を更新
      updateRoomActivity(roomId);
      
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
        
        // 再参加後にゲーム開始条件をチェック
        const allReady = Object.values(room.players).every(p => p.ready);
        const currentPlayerCount = Object.keys(room.players).length;
        
        log(`Room ${roomId}: playerCount=${currentPlayerCount}, allReady=${allReady}, inProgress=${room.inProgress}`);
        log(`Players ready status: ${JSON.stringify(Object.entries(room.players).map(([id, data]) => ({id: id.substring(0,8), username: data.username, ready: data.ready})))}`);
        
        if (allReady && currentPlayerCount === 2 && !room.inProgress) {
          room.inProgress = true;
          room.gameState = {
            currentTurn: 1,
            currentPlayer: Player.PLAYER1,
            player1Inventory: { rock: 5, paper: 5, scissors: 5, flag: 1 },
            player2Inventory: { rock: 5, paper: 5, scissors: 5, flag: 1 },
            board: Array(3).fill(null).map(() => Array(3).fill(null).map(() => ({ piece: PieceType.EMPTY, owner: Player.NONE, hasBeenUsed: false }))),
            gamePhase: GamePhase.PLAYING,
            gameResult: GameResult.ONGOING,
            lastMove: null,
            winningLine: null
          };
          
          const playersArray = Object.entries(room.players).map(([id, data]) => ({
            id,
            username: data.username,
            playerNumber: data.playerNumber,
            ready: data.ready
          }));
          
          io.to(roomId).emit("game:start", {
            roomId,
            players: playersArray,
            gameState: room.gameState
          });
          
          log(`Game started in room ${roomId}`);
        }
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
        
        // 新規参加後にゲーム開始条件をチェック
        const allReady = Object.values(room.players).every(p => p.ready);
        const currentPlayerCount = Object.keys(room.players).length;
        
        log(`Room ${roomId}: playerCount=${currentPlayerCount}, allReady=${allReady}, inProgress=${room.inProgress}`);
        log(`Players ready status: ${JSON.stringify(Object.entries(room.players).map(([id, data]) => ({id: id.substring(0,8), username: data.username, ready: data.ready})))}`);
        
        if (allReady && currentPlayerCount === 2 && !room.inProgress) {
          room.inProgress = true;
          room.gameState = {
            currentTurn: 1,
            currentPlayer: Player.PLAYER1,
            player1Inventory: { rock: 5, paper: 5, scissors: 5, flag: 1 },
            player2Inventory: { rock: 5, paper: 5, scissors: 5, flag: 1 },
            board: Array(3).fill(null).map(() => Array(3).fill(null).map(() => ({ piece: PieceType.EMPTY, owner: Player.NONE, hasBeenUsed: false }))),
            gamePhase: GamePhase.PLAYING,
            gameResult: GameResult.ONGOING,
            lastMove: null,
            winningLine: null
          };
          
          const playersArray = Object.entries(room.players).map(([id, data]) => ({
            id,
            username: data.username,
            playerNumber: data.playerNumber,
            ready: data.ready
          }));
          
          io.to(roomId).emit("game:start", {
            roomId,
            players: playersArray,
            gameState: room.gameState
          });
          
          log(`Game started in room ${roomId}`);
        }
      }
    });
    
    socket.on("player:ready", (roomId: string) => {
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
      const room = gameRooms[roomId];
      const playerSocketId = socket.id;

      log(`[game:request_rematch] Received from ${playerSocketId} for room ${roomId}`);

      if (!room) {
        log(`[game:request_rematch] Room ${roomId} not found.`);
        socket.emit("error", { message: "Room not found for rematch request." });
        return;
      }
      
      updateRoomActivity(roomId);

      if (!room.players[playerSocketId]) {
        log(`[game:request_rematch] Player ${playerSocketId} not in room ${roomId}.`);
        socket.emit("error", { message: "You are not in this room." });
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