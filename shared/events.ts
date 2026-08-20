// Socket.IO event names and payloads, shared by the client and the server.
//
// Both sides import these constants instead of writing string literals. A
// server emitting an event no client listens for — or a client emitting one no
// server handles — is a compile error rather than a packet that vanishes.
// Commit 4e51335 fixed exactly that class of bug by hand; this prevents it.

import {
  Board,
  GamePhase,
  GameResult,
  PieceType,
  Player,
  PlayerInventory,
  Position,
  WinningLine,
} from './gameTypes.js';

/** Events the client sends to the server. */
export const ClientEvent = {
  USER_JOIN: 'user:join',
  ROOM_CREATE: 'room:create',
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',
  PLAYER_READY: 'player:ready',
  GAME_MOVE: 'game:move',
  GAME_REQUEST_REMATCH: 'game:request_rematch',
  MATCHMAKING_JOIN: 'matchmaking:join',
  MATCHMAKING_CANCEL: 'matchmaking:cancel',
} as const;

/** Events the server sends to the client. */
export const ServerEvent = {
  GAME_ERROR: 'game:error',
  ROOM_CREATED: 'room:created',
  ROOM_JOINED: 'room:joined',
  ROOM_JOINED_SPECTATOR: 'room:joined:spectator',
  ROOM_LEFT_SUCCESS: 'room:left:success',
  ROOM_PLAYER_JOINED: 'room:player:joined',
  ROOM_PLAYER_READY: 'room:player:ready',
  PLAYER_LEFT: 'player:left',
  GAME_START: 'game:start',
  GAME_STATE_UPDATE: 'game:state:update',
  GAME_REMATCH_INITIATED: 'game:rematch:initiated',
  GAME_FORCE_END: 'game:force:end',
  MATCHMAKING_WAITING: 'matchmaking:waiting',
  MATCHMAKING_MATCHED: 'matchmaking:matched',
  MATCHMAKING_CANCELLED: 'matchmaking:cancelled',
} as const;

export type ClientEventName = (typeof ClientEvent)[keyof typeof ClientEvent];
export type ServerEventName = (typeof ServerEvent)[keyof typeof ServerEvent];

export type PlayerNumber = 1 | 2;

export interface RoomPlayer {
  id: string;
  username: string;
  playerNumber: PlayerNumber | null;
  ready: boolean;
}

export interface RoomPayload {
  roomId: string;
  players: RoomPlayer[];
}

export interface SharedGameState {
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

export interface MoveDetails {
  player: Player;
  piece: PieceType;
  position: Position;
  capturedPiece: PieceType | null;
  hasBeenUsed: boolean;
}

export interface GameMovePayload {
  roomId: string;
  position: Position;
  piece: PieceType;
}

export interface GameStateUpdatePayload {
  gameState: SharedGameState;
  moveDetails: MoveDetails | null;
}

export interface GameStartPayload extends RoomPayload {
  gameState: SharedGameState;
}

export interface RematchPayload extends RoomPayload {
  gameState: SharedGameState;
}

export interface PlayerLeftPayload {
  playerId: string;
  players: RoomPlayer[];
}

export interface PlayerReadyPayload extends PlayerLeftPayload {
  ready: boolean;
}

export interface GameErrorPayload {
  message: string;
}

export interface ForceEndPayload {
  message: string;
}
