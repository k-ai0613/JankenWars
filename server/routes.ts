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
  checkSocketRateLimit,
  getAllowedOrigins
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
      sessionToken: string; // 再接続時の本人確認用。ユーザー名の自己申告だけでは他人の座席を奪えてしまうため必須
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
// 対局中に切断してから再接続できる猶予。瞬断からの復帰が間に合う程度の短い時間にとどめる。
const DISCONNECT_GRACE_PERIOD = 15 * 1000;
// 上記猶予の判定専用インターバル。ROOM_CLEANUP_INTERVAL任せにすると実効レイテンシが
// 猶予の5倍近くまで伸びてしまうため、短い周期で独立してチェックする。
const DISCONNECT_SWEEP_INTERVAL = 3 * 1000;
const ROOM_INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 進行中でないルームの非アクティブ削除まで

// ルームの最終活動時間を更新する関数
function updateRoomActivity(roomId: string) {
  if (gameRooms[roomId]) {
    gameRooms[roomId].lastActivity = Date.now();
  }
}

// 24時間経過したルームを無条件で削除する。削除した場合true（このルームへの以降のチェックは不要）
function deleteIfExceededMaxLifetime(roomId: string, room: GameRoom, now: number): boolean {
  if (now - room.createdAt > ROOM_MAX_LIFETIME) {
    delete gameRooms[roomId];
    log(`Room ${roomId} deleted (exceeded max lifetime)`);
    return true;
  }
  return false;
}

// 空室の削除待ちタイマーを管理する。空室ならtrue（以降の非アクティブチェックは対象外）
function manageEmptyRoomPendingDeletion(roomId: string, room: GameRoom, now: number): boolean {
  if (Object.keys(room.players).length === 0) {
    if (!room.pendingDeletion) {
      room.pendingDeletion = now + ROOM_EMPTY_TIMEOUT;
      log(`Room ${roomId} marked for deletion in 5 minutes`);
    } else if (now >= room.pendingDeletion) {
      delete gameRooms[roomId];
      log(`Room ${roomId} deleted (empty timeout)`);
    }
    return true;
  }
  if (room.pendingDeletion) {
    delete room.pendingDeletion;
    log(`Room ${roomId} deletion cancelled (player returned)`);
  }
  return false;
}

// 進行中でないルームのみ、非アクティブ時間で削除する（対局中は削除しない）
function deleteIfInactiveRoom(roomId: string, room: GameRoom, now: number) {
  if (room.inProgress) return;
  if (now - room.lastActivity > ROOM_INACTIVITY_TIMEOUT) {
    delete gameRooms[roomId];
    log(`Room ${roomId} deleted (inactive timeout)`);
  }
}

// マッチメイキングキューの異常な滞留をクリーンアップ
function clearStaleMatchmakingQueue() {
  if (waitingUsers.length > 10) {
    log(`Clearing oversized matchmaking queue`);
    waitingUsers.length = 0;
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

  const httpServer = createServer(app);

  const io = new SocketIOServer(httpServer, {
    cors: {
      // Express層(index.ts)と同じ許可オリジン定義(server/security.ts)をSocket.IO層にも適用する
      origin: getAllowedOrigins(),
      methods: ["GET", "POST"]
    }
  });

  // 対局中に切断されたまま猶予期間(DISCONNECT_GRACE_PERIOD)を超えたプレイヤーを退室させ、
  // 残り1人になった場合はその人を勝者として対局を終了する。
  // ROOM_CLEANUP_INTERVAL(1分)の周期任せにすると、猶予15秒に対して実効レイテンシが
  // 最大75秒近くまで伸びてしまう(仕様上の意図と乖離する)ため、この関心事だけは
  // 短い専用インターバル(DISCONNECT_SWEEP_INTERVAL)で独立してチェックする。
  function evictExpiredDisconnectedPlayers() {
    const now = Date.now();

    Object.entries(gameRooms).forEach(([roomId, room]) => {
      if (!room.inProgress) return;

      // 期限切れのプレイヤーを先に全員洗い出してから一括削除する（両者が同時に
      // 期限切れになった場合に、直後に削除されるはずの相手を勝者にしてしまう
      // 状態不整合を避けるため、削除を1件ずつ行いながら判定してはならない）。
      const expiredSocketIds = Object.entries(room.players)
        .filter(([, data]) => data.disconnectedAt !== undefined && now - data.disconnectedAt! > DISCONNECT_GRACE_PERIOD)
        .map(([socketId]) => socketId);

      if (expiredSocketIds.length === 0) return;

      for (const socketId of expiredSocketIds) {
        delete room.players[socketId];
        log(`Room ${roomId}: player ${socketId} removed after disconnect grace period`);
      }

      const remainingEntries = Object.entries(room.players);
      if (remainingEntries.length === 1 && room.gameState && room.gameState.gameResult === GameResult.ONGOING) {
        // 勝者が確定する場合はgame:state:updateのみ送る。ここでplayer:leftも送ると、
        // クライアントのhandlePlayerLeftがgamePhase===GAME_OVER後のelse-if分岐で
        // gamePhaseをREADYに巻き戻してしまい、gameResult(勝利)と矛盾した状態になる。
        const [, winnerData] = remainingEntries[0];
        room.gameState.gamePhase = GamePhase.GAME_OVER;
        room.gameState.gameResult = winnerData.playerNumber === 1 ? GameResult.PLAYER1_WIN : GameResult.PLAYER2_WIN;
        room.inProgress = false;
        // 勝者のreadyを残したままにすると、公開ロビー経由で入室してきた第三者の
        // auto-ready(client側)に相乗りされ、勝者が同意なく新しい対局に組み込まれる
        winnerData.ready = false;

        io.to(roomId).emit("game:state:update", {
          gameState: room.gameState,
          moveDetails: null
        });
      } else if (remainingEntries.length === 0) {
        // 両者とも猶予切れで退室済み。inProgressをtrueのまま・gameStateをONGOINGのまま
        // 放置すると、後から同じルームコードに参加した第三者が幽霊対局を掴んでしまう
        room.inProgress = false;
        room.gameState = null;
      } else {
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
    });
  }
  setInterval(evictExpiredDisconnectedPlayers, DISCONNECT_SWEEP_INTERVAL);

  // ルームクリーンアップ処理（1分ごと）。切断猶予の判定は上のevictExpiredDisconnectedPlayersが
  // 別インターバルで担当するため、ここでは寿命・空室・非アクティブの管理のみを行う。
  setInterval(() => {
    const now = Date.now();

    Object.entries(gameRooms).forEach(([roomId, room]) => {
      if (deleteIfExceededMaxLifetime(roomId, room, now)) return;
      if (manageEmptyRoomPendingDeletion(roomId, room, now)) return;
      deleteIfInactiveRoom(roomId, room, now);
    });

    clearStaleMatchmakingQueue();
  }, ROOM_CLEANUP_INTERVAL);

  io.on("connection", (socket) => {
    log(`New client connected: ${socket.id}`);

    // 全イベント共通のレート制限（ソケット単位、1分間60イベントまで）。
    // socket.handshake.address はリバースプロキシ配下では全接続で同一になりうる
    // (engine.ioはExpressのtrust proxy設定を継承しない)ため、キーは必ずsocket.idを使う。
    socket.use((_packet, next) => {
      const result = checkSocketRateLimit(socket.id);
      if (result === 'limited-first') {
        socket.emit("game:error", { message: "Too many requests. Please slow down." });
      }
      if (result !== 'ok') {
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
        const sessionToken = uuidv4();

        const now = Date.now();
        gameRooms[roomId] = {
          id: roomId,
          players: {
            [socket.id]: {
              username,
              ready: false,
              playerNumber: 1,
              sessionToken
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
          sessionToken,
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
    
    socket.on("room:join", (roomId: string, sessionToken?: string) => {
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

      // このソケットが既にこの部屋のプレイヤーとして登録済み（二重room:join、再送、多重クリック）
      // なら、参加処理をやり直さず現在の状態を再送するだけにする
      if (room.players[socket.id]) {
        const roomDataForCurrentPlayer = {
          roomId,
          players: Object.entries(room.players).map(([id, data]) => ({
            id,
            username: data.username,
            playerNumber: data.playerNumber as 1 | 2,
            ready: data.ready
          }))
        };
        socket.emit("room:joined", roomDataForCurrentPlayer);
        if (room.inProgress && room.gameState) {
          socket.emit("game:state:update", {
            gameState: room.gameState,
            moveDetails: null
          });
        }
        return;
      }

      // 対局中の再接続は sessionToken の一致でのみ本人確認する。ユーザー名の自己申告
      // だけで一致させると、ロビー一覧や観戦で相手のユーザー名を知った第三者が
      // 切断猶予中の座席を乗っ取れてしまう。トークンが無い/一致しない場合は
      // （たとえユーザー名が一致していても）通常の観戦者経路に進める。
      if (room.inProgress) {
        const disconnectedPlayerEntry = sessionToken
          ? Object.entries(room.players).find(([, data]) =>
              data.sessionToken === sessionToken && data.disconnectedAt !== undefined
            )
          : undefined;

        if (disconnectedPlayerEntry) {
          const [oldSocketId, playerData] = disconnectedPlayerEntry;
          delete room.players[oldSocketId];
          delete playerData.disconnectedAt;
          room.players[socket.id] = playerData;

          socket.join(roomId);

          // sessionTokenは本人確認用の秘密情報。ルーム内の他プレイヤーへの
          // room:player:joined放送には絶対に含めず、本人へのroom:joinedにのみ載せる。
          const reconnectedPlayers = Object.entries(room.players).map(([id, data]) => ({
            id,
            username: data.username,
            playerNumber: data.playerNumber as 1 | 2,
            ready: data.ready
          }));

          socket.emit("room:joined", { roomId, sessionToken: playerData.sessionToken, players: reconnectedPlayers });
          socket.to(roomId).emit("room:player:joined", { roomId, players: reconnectedPlayers });

          if (room.gameState) {
            socket.emit("game:state:update", {
              gameState: room.gameState,
              moveDetails: null
            });
          }

          log(`Player reconnected during game: ${playerData.username} rejoined ${roomId} with new socket ${socket.id}`);
          return;
        }

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

        // sessionTokenは本人確認用の秘密情報。ルーム内の他プレイヤーへの
        // room:player:joined放送には絶対に含めず、本人へのroom:joinedにのみ載せる。
        const rejoiningPlayers = Object.entries(room.players).map(([id, data]) => ({
          id,
          username: data.username,
          playerNumber: data.playerNumber as 1 | 2,
          ready: data.ready
        }));

        socket.emit("room:joined", { roomId, sessionToken: playerData.sessionToken, players: rejoiningPlayers });
        socket.to(roomId).emit("room:player:joined", { roomId, players: rejoiningPlayers });
        
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
        const newPlayerToken = uuidv4();
        room.players[socket.id] = {
          username,
          ready: false,
          playerNumber: 2,
          sessionToken: newPlayerToken
        };

        socket.join(roomId);

        // sessionTokenは本人確認用の秘密情報。ルーム内の他プレイヤーへの
        // room:player:joined放送には絶対に含めず、本人へのroom:joinedにのみ載せる。
        const joinerPlayers = Object.entries(room.players).map(([id, data]) => ({
          id,
          username: data.username,
          playerNumber: data.playerNumber as 1 | 2,
          ready: data.ready
        }));
        socket.emit("room:joined", { roomId, sessionToken: newPlayerToken, players: joinerPlayers });

        socket.to(roomId).emit("room:player:joined", { roomId, players: joinerPlayers });

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
      // dataがnull/undefined/非オブジェクトで送られてくると分割代入自体が同期的にthrowし、
      // Socket.IOのディスパッチはこれを捕捉しないため、uncaughtExceptionでプロセス全体が
      // 落ちてインメモリの全対局が消える。検証より前に必ずガードする。
      if (!data || typeof data !== 'object') {
        socket.emit("game:error", { message: "Invalid move data" });
        return;
      }
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
        socket.emit("game:error", { message: "Game has already ended", gameState: room.gameState });
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
        // クライアントは楽観的にボードを更新済みの場合があるため、権威的な状態を返して
        // 復元させる。move側でスナップショットを取ってエラー時に巻き戻す方式は、
        // 無関係なエラー（他の理由のgame:error）到着時に正常な手まで巻き戻す危険があるため避ける。
        socket.emit("game:error", { message: "Not your turn", gameState });
        return;
      }

      // Check if valid move
      if (!isValidMove(gameState.board, position, piece, currentPlayer)) {
        socket.emit("game:error", { message: "Invalid move", gameState });
        return;
      }

      // Check if piece is in inventory
      const playerInventory = currentPlayer === Player.PLAYER1 ? gameState.player1Inventory : gameState.player2Inventory;
      if (playerInventory[piece] <= 0) {
        socket.emit("game:error", { message: "Piece not in inventory", gameState });
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

      // 対局が決着した場合は room.inProgress を戻す。これを怠ると room:leave/切断猶予/
      // 30分非アクティブ削除など inProgress を見て分岐する処理が「対局中」のまま扱い続け、
      // ロビーへの再表示・ready状態の残留といった不整合につながる。
      if (gameState.gamePhase === GamePhase.GAME_OVER) {
        room.inProgress = false;
        for (const id in room.players) {
          room.players[id].ready = false;
        }
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

        const wasInProgress = room.inProgress;
        if (wasInProgress) {
          room.inProgress = false;
          room.gameState = null;
          // 対局を終了させるので、切断猶予中のまま残っている幽霊プレイヤーも一緒に退室させる。
          // 放置すると誰にも回収されないまま部屋に居座り続け、次に同じルームコードへ
          // 入室した第三者が幽霊を相手にした対局を掴んでしまう。
          for (const [ghostSocketId, ghostData] of Object.entries(room.players)) {
            if (ghostData.disconnectedAt !== undefined) {
              delete room.players[ghostSocketId];
            }
          }
        }

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
        }

        if (wasInProgress) {
          log(`Player left during an ongoing game in room ${roomId}. Game state was reset.`);
          io.to(roomId).emit("game:force:end", { message: "Opponent left the game." });
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
        const player1Token = uuidv4();
        const player2Token = uuidv4();

        const now = Date.now();
        gameRooms[roomId] = {
          id: roomId,
          players: {
            [player1.socketId]: {
              username: player1.username,
              ready: true,
              playerNumber: 1,
              sessionToken: player1Token
            },
            [player2.socketId]: {
              username: player2.username,
              ready: true,
              playerNumber: 2,
              sessionToken: player2Token
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

        // トークンは本人のソケットにのみ届ける必要があるため、
        // io.to(roomId)の一斉送信ではなく個別に emit する
        const matchedPlayers = [
          {
            id: player1.socketId,
            username: player1.username,
            playerNumber: 1 as const,
            ready: true
          },
          {
            id: player2.socketId,
            username: player2.username,
            playerNumber: 2 as const,
            ready: true
          }
        ];
        io.sockets.sockets.get(player1.socketId)?.emit("matchmaking:matched", {
          roomId,
          sessionToken: player1Token,
          players: matchedPlayers
        });
        io.sockets.sockets.get(player2.socketId)?.emit("matchmaking:matched", {
          roomId,
          sessionToken: player2Token,
          players: matchedPlayers
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