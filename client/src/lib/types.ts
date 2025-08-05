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

// Helper function to safely convert any player value to actual Player enum
export function normalizePlayer(player: Player | string | any): Player {
  // If player is undefined or null
  if (player === undefined || player === null) {
    console.warn('normalizePlayer received undefined/null player:', player);
    return Player.NONE;
  }
  
  // If it's already a proper enum instance with exact equality
  if (player === Player.PLAYER1) return Player.PLAYER1;
  if (player === Player.PLAYER2) return Player.PLAYER2;
  if (player === Player.NONE) return Player.NONE;
  
  // Safer string comparison with exact matching
  const playerStr = String(player).toUpperCase();
  
  // Logging for debugging
  console.log('normalizePlayer string check:', {
    input: player,
    asString: playerStr,
    isP1ByIncludes: playerStr.includes('PLAYER1'),
    isP2ByIncludes: playerStr.includes('PLAYER2'),
    isP1ByExact: playerStr === 'PLAYER1',
    isP2ByExact: playerStr === 'PLAYER2'
  });
  
  // Try exact matching first
  if (playerStr === 'PLAYER1') return Player.PLAYER1;
  if (playerStr === 'PLAYER2') return Player.PLAYER2;
  if (playerStr === 'NONE') return Player.NONE;
  
  // Fall back to includes for backward compatibility
  if (playerStr.includes('PLAYER1')) return Player.PLAYER1;
  if (playerStr.includes('PLAYER2')) return Player.PLAYER2;
  
  // Default fallback with warning
  console.warn('normalizePlayer failed to match player, returning NONE:', player);
  return Player.NONE;
}

// Cell interface represents a square on the board
export interface Cell {
  piece: PieceType | null;
  owner: Player | null;
  hasBeenUsed: boolean; // If true, this cell cannot be used for any further moves (locked after janken battle)
  // 必要に応じて他のプロパティ (例: isRevealed など)
}

// Board is a 6x6 grid of cells
export type Board = Cell[][];

// Game phase
export enum GamePhase {
  NOT_CONNECTED = 'NOT_CONNECTED',
  READY = 'READY',
  SELECTING_CELL = 'SELECTING_CELL',
  GAME_OVER = 'GAME_OVER',
  SHOWDOWN = 'SHOWDOWN',
  ENDED = 'ENDED'
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

// Position on the board
export interface Position {
  row: number;
  col: number;
}

// 勝利ラインを示す座標の配列
export interface WinningLine {
  positions: Position[];
  player: Player;
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
  winningLine: WinningLine | null; // 勝利ラインの情報（存在しない場合はnull）
}
