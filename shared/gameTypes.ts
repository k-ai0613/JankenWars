// Core game types shared by the client and the server.
//
// This is the single source of truth. Do not redeclare these enums anywhere
// else — the client and the server drifting apart (numeric enums on one side,
// string enums on the other) is what commit ddda9a2 had to repair.

export enum PieceType {
  ROCK = 'ROCK',
  PAPER = 'PAPER',
  SCISSORS = 'SCISSORS',
  SPECIAL = 'SPECIAL',
  EMPTY = 'EMPTY',
}

export enum Player {
  PLAYER1 = 'PLAYER1',
  PLAYER2 = 'PLAYER2',
  NONE = 'NONE',
}

export enum GamePhase {
  NOT_CONNECTED = 'NOT_CONNECTED',
  READY = 'READY',
  SELECTING_CELL = 'SELECTING_CELL',
  GAME_OVER = 'GAME_OVER',
  SHOWDOWN = 'SHOWDOWN',
  ENDED = 'ENDED',
}

export enum GameResult {
  PLAYER1_WIN = 'PLAYER1_WIN',
  PLAYER2_WIN = 'PLAYER2_WIN',
  DRAW = 'DRAW',
  ONGOING = 'ONGOING',
}

export interface Position {
  row: number;
  col: number;
}

export interface Cell {
  piece: PieceType | null;
  /** Player.NONE for an empty cell. */
  owner: Player | null;
  /** Locked by a janken battle — no further moves are allowed on this cell. */
  hasBeenUsed: boolean;
}

export type Board = Cell[][];

export interface WinningLine {
  positions: Position[];
  player: Player;
}

export interface PlayerInventory {
  [PieceType.ROCK]: number;
  [PieceType.PAPER]: number;
  [PieceType.SCISSORS]: number;
  [PieceType.SPECIAL]: number;
}

/** The piece types that take part in a janken battle. */
export type CombatPiece = PieceType.ROCK | PieceType.PAPER | PieceType.SCISSORS;

export function isCombatPiece(piece: PieceType | null | undefined): piece is CombatPiece {
  return piece === PieceType.ROCK || piece === PieceType.PAPER || piece === PieceType.SCISSORS;
}

/** Runtime guard for values arriving over the wire. */
export function isPieceType(value: unknown): value is PieceType {
  return typeof value === 'string' && Object.values(PieceType).includes(value as PieceType);
}

/** Runtime guard for values arriving over the wire. */
export function isPlayer(value: unknown): value is Player {
  return typeof value === 'string' && Object.values(Player).includes(value as Player);
}
