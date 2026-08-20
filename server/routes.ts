import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer, type Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import { log } from "./vite.js";
import {
  validateRoomId,
  validateUsername,
  validateGameMove,
  allowSocketEvent,
  releaseSocketLimits,
  getAllowedOrigins,
} from "./security.js";
import {
  Board,
  Player,
  PieceType,
  PlayerInventory,
  GamePhase,
  GameResult,
  Position,
  WinningLine,
} from "./types.js";
import {
  createEmptyBoard,
  createInitialInventory,
  isValidMove,
  applyMove,
  checkDraw,
  findWinningLine,
} from "./gameUtils.js";
import {
  ClientEvent,
  ServerEvent,
  type GameMovePayload,
  type PlayerNumber,
  type RoomPlayer,
} from "../shared/events.js";

// サーバーの起動時間を記録
const SERVER_START_TIME = new Date();
const SERVER_VERSION = '1.0.1';

// ---------------------------------------------------------------------------
// Limits
// ---------------------------------------------------------------------------

/** Per-socket, per-minute budget for each event. */
const EVENT_LIMITS: Record<string, number> = {
  [ClientEvent.USER_JOIN]: 20,
  [ClientEvent.ROOM_CREATE]: 10,
  [ClientEvent.ROOM_JOIN]: 30,
  [ClientEvent.ROOM_LEAVE]: 30,
  [ClientEvent.PLAYER_READY]: 60,
  [ClientEvent.GAME_MOVE]: 120,
  [ClientEvent.GAME_REQUEST_REMATCH]: 20,
  [ClientEvent.MATCHMAKING_JOIN]: 20,
  [ClientEvent.MATCHMAKING_CANCEL]: 20,
};

/** Rooms one socket may occupy at once. */
const MAX_ROOMS_PER_SOCKET = 3;

/** Hard ceiling on live rooms, so a burst cannot exhaust memory. */
const MAX_TOTAL_ROOMS = 500;

/** Longest the matchmaking queue may grow. */
const MAX_MATCHMAKING_QUEUE = 100;

// ルーム管理設定
const ROOM_EMPTY_TIMEOUT = 5 * 60 * 1000; // 5分間空のルームを保持
const ROOM_CLEANUP_INTERVAL = 60 * 1000; // 1分ごとにクリーンアップチェック
const ROOM_MAX_LIFETIME = 24 * 60 * 60 * 1000; // 24時間で自動削除
const ROOM_INACTIVE_TIMEOUT = 30 * 60 * 1000; // 30分間非アクティブなルームを削除

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

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
      playerNumber: PlayerNumber | null;
    }
  };
  gameState: GameState | null;
  inProgress: boolean;
  spectators: string[];
  createdAt: number;
  lastActivity: number;
  pendingDeletion?: number;
}

const gameRooms: { [roomId: string]: GameRoom } = {};

let waitingUsers: { socketId: string, username: string }[] = [];

// 古いルームのクリーンアップ
const roomCleanup = setInterval(() => {
  const now = Date.now();

  for (const [roomId, room] of Object.entries(gameRooms)) {
    const playerCount = Object.keys(room.players).length;

    if (now - room.createdAt > ROOM_MAX_LIFETIME) {
      delete gameRooms[roomId];
      log(`Room ${roomId} deleted (exceeded max lifetime)`);
      continue;
    }

    if (now - room.lastActivity > ROOM_INACTIVE_TIMEOUT) {
      delete gameRooms[roomId];
      log(`Room ${roomId} deleted (inactive)`);
      continue;
    }

    if (playerCount === 0) {
      if (!room.pendingDeletion) {
        room.pendingDeletion = now + ROOM_EMPTY_TIMEOUT;
        log(`Room ${roomId} marked for deletion in 5 minutes`);
      } else if (now >= room.pendingDeletion) {
        delete gameRooms[roomId];
        log(`Room ${roomId} deleted (empty timeout)`);
      }
    } else if (room.pendingDeletion) {
      delete room.pendingDeletion;
      log(`Room ${roomId} deletion cancelled (player returned)`);
    }
  }

  if (waitingUsers.length > MAX_MATCHMAKING_QUEUE) {
    log(`Trimming oversized matchmaking queue (${waitingUsers.length})`);
    waitingUsers.length = MAX_MATCHMAKING_QUEUE;
  }
}, ROOM_CLEANUP_INTERVAL);
roomCleanup.unref();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function updateRoomActivity(roomId: string) {
  const room = gameRooms[roomId];
  if (room) room.lastActivity = Date.now();
}

function toRoomPlayers(room: GameRoom): RoomPlayer[] {
  return Object.entries(room.players).map(([id, data]) => ({
    id,
    username: data.username,
    playerNumber: data.playerNumber,
    ready: data.ready,
  }));
}

function roomsOccupiedBy(socketId: string): number {
  return Object.values(gameRooms).filter((room) => room.players[socketId] !== undefined).length;
}

function createFreshGameState(phase: GamePhase): GameState {
  return {
    board: createEmptyBoard(),
    player1Inventory: createInitialInventory(),
    player2Inventory: createInitialInventory(),
    currentPlayer: Player.PLAYER1,
    currentTurn: 1,
    gamePhase: phase,
    gameResult: GameResult.ONGOING,
    lastMove: null,
    winningLine: null,
  };
}

function playerFromNumber(playerNumber: PlayerNumber | null): Player | null {
  if (playerNumber === 1) return Player.PLAYER1;
  if (playerNumber === 2) return Player.PLAYER2;
  return null;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // ヘルスチェックエンドポイント
  app.get('/api/health', (_req, res) => {
    const currentUptime = Math.floor((Date.now() - SERVER_START_TIME.getTime()) / 1000);
    res.json({
      status: 'ok',
      version: SERVER_VERSION,
      uptime: currentUptime,
      startTime: SERVER_START_TIME.toISOString(),
      env: process.env.NODE_ENV || 'development',
    });
  });

  app.get('/api/game-rooms', (_req, res) => {
    const availableRooms = Object.entries(gameRooms)
      .filter(([, room]) => !room.inProgress)
      .map(([id, room]) => ({
        id,
        playerCount: Object.keys(room.players).length,
        players: Object.values(room.players).map(p => p.username),
      }));

    res.json({ rooms: availableRooms });
  });

  const httpServer = createServer(app);

  const io = new SocketIOServer(httpServer, {
    cors: {
      // 以前は origin: "*" で、Express 側のオリジン制限を素通りしていた。
      origin: getAllowedOrigins(),
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  /**
   * Remove a player from a room and tell everyone still in it.
   *
   * room:leave and disconnect both route through here. They used to carry
   * separate copies of this logic and only room:leave was ever updated, so a
   * disconnect left the room stuck at inProgress: true forever and the
   * opponent was never told the game had ended.
   */
  function removePlayerFromRoom(socket: Socket, roomId: string, reason: string): boolean {
    const room = gameRooms[roomId];
    if (!room || !room.players[socket.id]) return false;

    const { username } = room.players[socket.id];
    delete room.players[socket.id];
    socket.leave(roomId);
    updateRoomActivity(roomId);

    log(`Player ${username} (${socket.id}) left room ${roomId} (${reason})`);

    const remainingPlayers = Object.keys(room.players).length;
    const wasInProgress = room.inProgress;

    // 対局中に抜けた場合は必ずゲームを終了させ、ルームを再利用可能に戻す
    if (wasInProgress) {
      room.inProgress = false;
      room.gameState = null;
      for (const id of Object.keys(room.players)) {
        room.players[id].ready = false;
      }
    }

    if (remainingPlayers === 0) {
      if (!room.pendingDeletion) {
        room.pendingDeletion = Date.now() + ROOM_EMPTY_TIMEOUT;
        log(`Room ${roomId} marked for deletion (became empty)`);
      }
      return true;
    }

    io.to(roomId).emit(ServerEvent.PLAYER_LEFT, {
      playerId: socket.id,
      players: toRoomPlayers(room),
    });

    if (wasInProgress) {
      io.to(roomId).emit(ServerEvent.GAME_FORCE_END, { message: "Opponent left the game." });
      log(`Game in room ${roomId} force-ended (${reason})`);
    }

    return true;
  }

  io.on("connection", (socket) => {
    log(`New client connected: ${socket.id}`);

    const fail = (message: string) => {
      socket.emit(ServerEvent.GAME_ERROR, { message });
    };

    /**
     * Register a handler that cannot take the server down.
     *
     * Every listener runs inside a try/catch. Socket.IO dispatches listeners
     * from a process.nextTick callback, so an exception escaping one reaches
     * the uncaughtException handler — which called process.exit(1) and dropped
     * every in-progress game. `socket.emit('game:move')` with no payload was
     * enough to trigger it.
     */
    const on = <T>(
      event: string,
      guard: (payload: unknown) => payload is T,
      handler: (payload: T) => void,
    ) => {
      socket.on(event, (raw: unknown) => {
        try {
          const limit = EVENT_LIMITS[event];
          if (limit !== undefined && !allowSocketEvent(socket.id, event, limit)) {
            fail("Too many requests. Please slow down.");
            return;
          }

          if (!guard(raw)) {
            fail(`Invalid payload for ${event}.`);
            return;
          }

          handler(raw);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          log(`Error handling ${event} from ${socket.id}: ${message}`);
          console.error(`[${event}]`, error);
          fail("Server error while processing the request.");
        }
      });
    };

    const isString = (value: unknown): value is string => typeof value === 'string';
    const isVoid = (_value: unknown): _value is undefined => true;
    const isMovePayload = (value: unknown): value is GameMovePayload =>
      !!value && typeof value === 'object' && !Array.isArray(value);

    // -----------------------------------------------------------------------

    on(ClientEvent.USER_JOIN, isString, (username) => {
      if (!validateUsername(username)) {
        fail("Invalid username.");
        return;
      }
      log(`User joined: ${username} (${socket.id})`);
      socket.data.username = username;
    });

    on(ClientEvent.ROOM_CREATE, isVoid, () => {
      if (Object.keys(gameRooms).length >= MAX_TOTAL_ROOMS) {
        fail("The server is at capacity. Please try again shortly.");
        return;
      }

      if (roomsOccupiedBy(socket.id) >= MAX_ROOMS_PER_SOCKET) {
        fail("You already have too many open rooms.");
        return;
      }

      const roomId = uuidv4().substring(0, 8);
      const username = socket.data.username || "Anonymous";
      const now = Date.now();

      gameRooms[roomId] = {
        id: roomId,
        players: {
          [socket.id]: { username, ready: false, playerNumber: 1 },
        },
        gameState: null,
        inProgress: false,
        spectators: [],
        createdAt: now,
        lastActivity: now,
      };

      socket.join(roomId);
      socket.emit(ServerEvent.ROOM_CREATED, {
        roomId,
        players: toRoomPlayers(gameRooms[roomId]),
      });

      log(`Room created: ${roomId} by ${username}`);
    });

    on(ClientEvent.ROOM_JOIN, isString, (roomId) => {
      if (!validateRoomId(roomId)) {
        fail("Invalid room ID");
        return;
      }

      const room = gameRooms[roomId];
      if (!room) {
        fail("Room not found");
        return;
      }

      const username = socket.data.username || "Anonymous";
      updateRoomActivity(roomId);

      // 既にこのルームに居る場合は何もしない
      if (room.players[socket.id]) {
        socket.emit(ServerEvent.ROOM_JOINED, { roomId, players: toRoomPlayers(room) });
        return;
      }

      const joinAsSpectator = () => {
        if (!room.spectators.includes(socket.id)) room.spectators.push(socket.id);
        socket.join(roomId);
        socket.emit(ServerEvent.ROOM_JOINED_SPECTATOR, { roomId, players: toRoomPlayers(room) });
        if (room.inProgress && room.gameState) {
          socket.emit(ServerEvent.GAME_STATE_UPDATE, { gameState: room.gameState, moveDetails: null });
        }
      };

      if (room.inProgress) {
        joinAsSpectator();
        return;
      }

      const playerCount = Object.keys(room.players).length;

      // 同じユーザー名で、かつそのソケットが切断されている場合のみ再接続とみなす
      const existingPlayerEntry = Object.entries(room.players).find(([socketId, data]) =>
        data.username === username && !io.sockets.sockets.has(socketId)
      );

      if (existingPlayerEntry) {
        const [oldSocketId, playerData] = existingPlayerEntry;
        delete room.players[oldSocketId];
        room.players[socket.id] = playerData;
        socket.join(roomId);

        const payload = { roomId, players: toRoomPlayers(room) };
        socket.emit(ServerEvent.ROOM_JOINED, payload);
        socket.to(roomId).emit(ServerEvent.ROOM_PLAYER_JOINED, payload);

        log(`Player rejoined room: ${username} rejoined ${roomId} with new socket ${socket.id}`);
        return;
      }

      if (playerCount >= 2) {
        joinAsSpectator();
        return;
      }

      if (roomsOccupiedBy(socket.id) >= MAX_ROOMS_PER_SOCKET) {
        fail("You are already in too many rooms.");
        return;
      }

      // 空いている番号を割り当てる（1 が空いていれば 1）
      const takenNumbers = new Set(Object.values(room.players).map((p) => p.playerNumber));
      const playerNumber: PlayerNumber = takenNumbers.has(1) ? 2 : 1;

      room.players[socket.id] = { username, ready: false, playerNumber };
      socket.join(roomId);

      const payload = { roomId, players: toRoomPlayers(room) };
      socket.emit(ServerEvent.ROOM_JOINED, payload);
      socket.to(roomId).emit(ServerEvent.ROOM_PLAYER_JOINED, payload);

      log(`Player joined room: ${username} joined ${roomId} as P${playerNumber}`);
    });

    on(ClientEvent.PLAYER_READY, isString, (roomId) => {
      if (!validateRoomId(roomId)) {
        fail("Invalid room ID");
        return;
      }

      const room = gameRooms[roomId];
      if (!room || !room.players[socket.id]) return;

      updateRoomActivity(roomId);

      if (room.inProgress) {
        fail("The game is already in progress.");
        return;
      }

      room.players[socket.id].ready = !room.players[socket.id].ready;

      io.to(roomId).emit(ServerEvent.ROOM_PLAYER_READY, {
        playerId: socket.id,
        ready: room.players[socket.id].ready,
        players: toRoomPlayers(room),
      });

      const playerCount = Object.keys(room.players).length;
      const allReady = Object.values(room.players).every(p => p.ready);

      if (allReady && playerCount === 2) {
        room.inProgress = true;
        room.gameState = createFreshGameState(GamePhase.SELECTING_CELL);

        io.to(roomId).emit(ServerEvent.GAME_START, {
          roomId,
          players: toRoomPlayers(room),
          gameState: room.gameState,
        });
        log(`Game started in room ${roomId}`);
      }
    });

    on(ClientEvent.GAME_MOVE, isMovePayload, (data) => {
      const { roomId, position, piece } = data;

      if (!validateRoomId(roomId)) {
        fail("Invalid room ID");
        return;
      }

      if (!validateGameMove(position, piece)) {
        fail("Invalid move data");
        return;
      }

      const room = gameRooms[roomId];
      if (!room) {
        fail("Room not found");
        return;
      }

      updateRoomActivity(roomId);

      if (!room.inProgress || !room.gameState) {
        fail("Game not in progress");
        return;
      }

      const gameState = room.gameState;

      // 終局後の着手を拒否する。以前は gamePhase を一切見ておらず、
      // 勝者だけがターンを保持したまま無制限に駒を置き続けられた。
      if (gameState.gamePhase === GamePhase.GAME_OVER || gameState.gameResult !== GameResult.ONGOING) {
        fail("The game is already over.");
        return;
      }

      const playerInfo = room.players[socket.id];
      if (!playerInfo) {
        fail("Player not in room");
        return;
      }

      const movingPlayer = playerFromNumber(playerInfo.playerNumber);
      if (!movingPlayer) {
        fail("You are not seated in this game.");
        return;
      }

      if (movingPlayer !== gameState.currentPlayer) {
        fail("Not your turn");
        return;
      }

      const playerInventory =
        movingPlayer === Player.PLAYER1 ? gameState.player1Inventory : gameState.player2Inventory;

      if (playerInventory[piece] <= 0) {
        fail("Piece not in inventory");
        return;
      }

      // 共有ルールでの検証。じゃんけんの勝敗判定もここに含まれる。
      if (!isValidMove(gameState.board, position, piece, movingPlayer)) {
        fail("Invalid move");
        return;
      }

      const { board: newBoard, capturedPiece, locked } = applyMove(
        gameState.board,
        position,
        piece,
        movingPlayer,
      );

      playerInventory[piece]--;
      gameState.board = newBoard;
      gameState.lastMove = { player: movingPlayer, piece, position };

      const winLine = findWinningLine(newBoard, movingPlayer);
      if (winLine) {
        gameState.gamePhase = GamePhase.GAME_OVER;
        gameState.gameResult =
          movingPlayer === Player.PLAYER1 ? GameResult.PLAYER1_WIN : GameResult.PLAYER2_WIN;
        gameState.winningLine = winLine;
      } else if (checkDraw(newBoard, gameState.player1Inventory, gameState.player2Inventory)) {
        gameState.gamePhase = GamePhase.GAME_OVER;
        gameState.gameResult = GameResult.DRAW;
        gameState.winningLine = null;
      } else {
        gameState.currentPlayer =
          movingPlayer === Player.PLAYER1 ? Player.PLAYER2 : Player.PLAYER1;
        gameState.currentTurn = gameState.currentTurn === 1 ? 2 : 1;
      }

      io.to(roomId).emit(ServerEvent.GAME_STATE_UPDATE, {
        gameState,
        moveDetails: {
          player: movingPlayer,
          piece,
          position,
          capturedPiece,
          hasBeenUsed: locked,
        },
      });

      log(`Move applied in room ${roomId}. Next turn: ${gameState.currentPlayer}`);
    });

    on(ClientEvent.GAME_REQUEST_REMATCH, isString, (roomId) => {
      if (!validateRoomId(roomId)) {
        fail("Invalid room ID");
        return;
      }

      const room = gameRooms[roomId];
      if (!room) {
        fail("Room not found for rematch request.");
        return;
      }

      if (!room.players[socket.id]) {
        fail("You are not in this room.");
        return;
      }

      updateRoomActivity(roomId);

      // 対局中のリセットを拒否する。以前は所属チェックしかなく、
      // 不利な側がいつでも盤面を白紙に戻せた。
      if (room.inProgress && room.gameState && room.gameState.gamePhase !== GamePhase.GAME_OVER) {
        fail("You cannot restart while the game is in progress.");
        return;
      }

      room.inProgress = false;
      room.gameState = createFreshGameState(GamePhase.READY);

      for (const id of Object.keys(room.players)) {
        room.players[id].ready = false;
      }

      log(`Game reset for room ${roomId}. Waiting for players to be ready.`);

      io.to(roomId).emit(ServerEvent.GAME_REMATCH_INITIATED, {
        roomId,
        players: toRoomPlayers(room),
        gameState: room.gameState,
      });
    });

    on(ClientEvent.ROOM_LEAVE, isString, (roomId) => {
      if (!validateRoomId(roomId)) {
        fail("Invalid room ID");
        return;
      }

      const removed = removePlayerFromRoom(socket, roomId, "room:leave");
      if (removed) {
        socket.emit(ServerEvent.ROOM_LEFT_SUCCESS);
        return;
      }

      // 観戦者としての退出
      const room = gameRooms[roomId];
      if (room) {
        const index = room.spectators.indexOf(socket.id);
        if (index !== -1) room.spectators.splice(index, 1);
        socket.leave(roomId);
      }
      socket.emit(ServerEvent.ROOM_LEFT_SUCCESS);
    });

    on(ClientEvent.MATCHMAKING_JOIN, isVoid, () => {
      const username = socket.data.username || "Anonymous";

      // 同一ソケットの重複登録を弾く。以前は2回送ると自分自身とマッチし、
      // ソケットIDがキー衝突してプレイヤー1人の壊れたルームが生まれた。
      if (waitingUsers.some((u) => u.socketId === socket.id)) {
        socket.emit(ServerEvent.MATCHMAKING_WAITING);
        return;
      }

      if (waitingUsers.length >= MAX_MATCHMAKING_QUEUE) {
        fail("Matchmaking queue is full. Please try again shortly.");
        return;
      }

      waitingUsers.push({ socketId: socket.id, username });
      log(`User ${username} joined matchmaking queue`);

      // 生きているソケット同士でのみマッチさせる
      while (waitingUsers.length >= 2) {
        const player1 = waitingUsers.shift()!;
        if (!io.sockets.sockets.has(player1.socketId)) continue;

        const partnerIndex = waitingUsers.findIndex(
          (u) => u.socketId !== player1.socketId && io.sockets.sockets.has(u.socketId),
        );
        if (partnerIndex === -1) {
          waitingUsers.unshift(player1);
          break;
        }

        const player2 = waitingUsers.splice(partnerIndex, 1)[0];

        if (Object.keys(gameRooms).length >= MAX_TOTAL_ROOMS) {
          waitingUsers.unshift(player2, player1);
          fail("The server is at capacity. Please try again shortly.");
          return;
        }

        const roomId = uuidv4().substring(0, 8);
        const now = Date.now();

        gameRooms[roomId] = {
          id: roomId,
          players: {
            [player1.socketId]: { username: player1.username, ready: true, playerNumber: 1 },
            [player2.socketId]: { username: player2.username, ready: true, playerNumber: 2 },
          },
          gameState: null,
          inProgress: false,
          spectators: [],
          createdAt: now,
          lastActivity: now,
        };

        io.sockets.sockets.get(player1.socketId)?.join(roomId);
        io.sockets.sockets.get(player2.socketId)?.join(roomId);

        io.to(roomId).emit(ServerEvent.MATCHMAKING_MATCHED, {
          roomId,
          players: toRoomPlayers(gameRooms[roomId]),
        });

        log(`Matched ${player1.username} and ${player2.username} in room ${roomId}`);
        return;
      }

      socket.emit(ServerEvent.MATCHMAKING_WAITING);
    });

    on(ClientEvent.MATCHMAKING_CANCEL, isVoid, () => {
      waitingUsers = waitingUsers.filter(u => u.socketId !== socket.id);
      socket.emit(ServerEvent.MATCHMAKING_CANCELLED);
    });

    socket.on("disconnect", () => {
      try {
        waitingUsers = waitingUsers.filter(u => u.socketId !== socket.id);
        releaseSocketLimits(socket.id);

        for (const roomId of Object.keys(gameRooms)) {
          const room = gameRooms[roomId];
          if (!room) continue;

          removePlayerFromRoom(socket, roomId, "disconnect");

          const spectatorIndex = room.spectators.indexOf(socket.id);
          if (spectatorIndex !== -1) room.spectators.splice(spectatorIndex, 1);
        }

        log(`Client disconnected: ${socket.id}`);
      } catch (error) {
        console.error("[disconnect]", error);
      }
    });
  });

  return httpServer;
}
