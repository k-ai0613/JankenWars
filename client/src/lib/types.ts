// Types for the Janken Wars game

// Piece types
export enum PieceType {
  ROCK = 'ROCK',
  PAPER = 'PAPER',
  SCISSORS = 'SCISSORS',
  SPECIAL = 'SPECIAL',
  EMPTY = 'EMPTY'
}

// Player identifiers
export enum Player {
  PLAYER1 = 'PLAYER1',
  PLAYER2 = 'PLAYER2',
  NONE = 'NONE'
}

// Cell interface represents a square on the board
export interface Cell {
  piece: PieceType;
  owner: Player;
}

// Board is a 6x6 grid of cells
export type Board = Cell[][];

// Game phase
export enum GamePhase {
  READY = 'READY',
  SELECTING_CELL = 'SELECTING_CELL',
  GAME_OVER = 'GAME_OVER'
}

// Game result
export enum GameResult {
  PLAYER1_WIN = 'PLAYER1_WIN',
  PLAYER2_WIN = 'PLAYER2_WIN',
  DRAW = 'DRAW',
  ONGOING = 'ONGOING'
}

// Player's inventory of pieces
export interface PlayerInventory {
  [PieceType.ROCK]: number;
  [PieceType.PAPER]: number;
  [PieceType.SCISSORS]: number;
  [PieceType.SPECIAL]: number;
}

// Game state
export interface GameState {
  board: Board;
  currentPlayer: Player;
  phase: GamePhase;
  result: GameResult;
  selectedPiece: PieceType | null;
  player1Inventory: PlayerInventory;
  player2Inventory: PlayerInventory;
  message: string;
}

// Position on the board
export interface Position {
  row: number;
  col: number;
}
