// Server-side type definitions
export enum Player {
  PLAYER1 = 1,
  PLAYER2 = 2,
}

export enum PieceType {
  EMPTY = 0,
  ROCK = 1,
  PAPER = 2,
  SCISSORS = 3,
  FLAG = 4,
}

export enum GamePhase {
  READY = "ready",
  SELECTING_CELL = "selecting_cell", 
  PLACING_PIECE = "placing_piece",
  GAME_OVER = "game_over",
}

export enum GameResult {
  ONGOING = "ongoing",
  PLAYER1_WIN = "player1_win", 
  PLAYER2_WIN = "player2_win",
  DRAW = "draw",
}

export interface Position {
  row: number;
  col: number;
}

export interface Cell {
  piece: PieceType;
  owner: Player | null;
  hasBeenUsed?: boolean;
}

export interface WinningLine {
  start: Position;
  end: Position;
  direction: 'horizontal' | 'vertical' | 'diagonal';
}

export type Board = Cell[][];

export interface PlayerInventory {
  [PieceType.ROCK]: number;
  [PieceType.PAPER]: number;
  [PieceType.SCISSORS]: number;
  [PieceType.FLAG]: number;
}