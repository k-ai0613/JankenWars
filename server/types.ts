// Server-side type definitions
// Unified with client types (string enums)

export enum Player {
  PLAYER1 = 'PLAYER1',
  PLAYER2 = 'PLAYER2',
  NONE = 'NONE',
}

export enum PieceType {
  ROCK = 'ROCK',
  PAPER = 'PAPER',
  SCISSORS = 'SCISSORS',
  SPECIAL = 'SPECIAL',
  EMPTY = 'EMPTY',
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
  ONGOING = 'ONGOING',
  PLAYER1_WIN = 'PLAYER1_WIN',
  PLAYER2_WIN = 'PLAYER2_WIN',
  DRAW = 'DRAW',
}

export interface Position {
  row: number;
  col: number;
}

export interface Cell {
  piece: PieceType | null;
  owner: Player | null;
  hasBeenUsed: boolean;
}

export interface WinningLine {
  positions: Position[];
  player: Player;
}

export type Board = Cell[][];

export interface PlayerInventory {
  [PieceType.ROCK]: number;
  [PieceType.PAPER]: number;
  [PieceType.SCISSORS]: number;
  [PieceType.SPECIAL]: number;
}
