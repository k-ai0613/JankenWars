import { Board, Cell, Player, PieceType, PlayerInventory, Position, WinningLine } from "./types.js";

const BOARD_SIZE = 6;
const WIN_LENGTH = 4;

export function createEmptyBoard(): Board {
  const board: Board = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    board[row] = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      board[row][col] = {
        piece: PieceType.EMPTY,
        owner: Player.NONE,
        hasBeenUsed: false,
      };
    }
  }
  return board;
}

export function createInitialInventory(): PlayerInventory {
  return {
    [PieceType.ROCK]: 7,
    [PieceType.PAPER]: 7,
    [PieceType.SCISSORS]: 7,
    [PieceType.SPECIAL]: 1,
  };
}

export function isValidMove(
  board: Board,
  position: Position,
  piece: PieceType,
  player: Player
): boolean {
  const { row, col } = position;

  // Check bounds
  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
    return false;
  }

  const cell = board[row][col];

  // Cannot place on locked cells
  if (cell.hasBeenUsed) {
    return false;
  }

  // Can place on empty cell
  if (cell.piece === PieceType.EMPTY) {
    return true;
  }

  // Cannot place on own pieces
  if (cell.owner === player) {
    return false;
  }

  // Special piece can only be placed on empty cells
  if (piece === PieceType.SPECIAL) {
    return false;
  }

  // Cannot capture special pieces
  if (cell.piece === PieceType.SPECIAL) {
    return false;
  }

  // Can capture opponent's piece (janken battle resolved by client/server logic)
  return true;
}

export function checkWin(board: Board, player: Player): boolean {
  return findWinningLine(board, player) !== null;
}

export function findWinningLine(board: Board, player: Player): WinningLine | null {
  // Check horizontal lines
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col <= BOARD_SIZE - WIN_LENGTH; col++) {
      const positions: Position[] = [];
      let count = 0;
      for (let i = 0; i < WIN_LENGTH; i++) {
        if (board[row][col + i].owner === player && board[row][col + i].piece !== PieceType.EMPTY) {
          count++;
          positions.push({ row, col: col + i });
        } else {
          break;
        }
      }
      if (count === WIN_LENGTH) {
        return { positions, player };
      }
    }
  }

  // Check vertical lines
  for (let col = 0; col < BOARD_SIZE; col++) {
    for (let row = 0; row <= BOARD_SIZE - WIN_LENGTH; row++) {
      const positions: Position[] = [];
      let count = 0;
      for (let i = 0; i < WIN_LENGTH; i++) {
        if (board[row + i][col].owner === player && board[row + i][col].piece !== PieceType.EMPTY) {
          count++;
          positions.push({ row: row + i, col });
        } else {
          break;
        }
      }
      if (count === WIN_LENGTH) {
        return { positions, player };
      }
    }
  }

  // Check diagonal lines (top-left to bottom-right)
  for (let row = 0; row <= BOARD_SIZE - WIN_LENGTH; row++) {
    for (let col = 0; col <= BOARD_SIZE - WIN_LENGTH; col++) {
      const positions: Position[] = [];
      let count = 0;
      for (let i = 0; i < WIN_LENGTH; i++) {
        if (board[row + i][col + i].owner === player && board[row + i][col + i].piece !== PieceType.EMPTY) {
          count++;
          positions.push({ row: row + i, col: col + i });
        } else {
          break;
        }
      }
      if (count === WIN_LENGTH) {
        return { positions, player };
      }
    }
  }

  // Check diagonal lines (top-right to bottom-left)
  for (let row = 0; row <= BOARD_SIZE - WIN_LENGTH; row++) {
    for (let col = WIN_LENGTH - 1; col < BOARD_SIZE; col++) {
      const positions: Position[] = [];
      let count = 0;
      for (let i = 0; i < WIN_LENGTH; i++) {
        if (board[row + i][col - i].owner === player && board[row + i][col - i].piece !== PieceType.EMPTY) {
          count++;
          positions.push({ row: row + i, col: col - i });
        } else {
          break;
        }
      }
      if (count === WIN_LENGTH) {
        return { positions, player };
      }
    }
  }

  return null;
}

export function checkDraw(
  board: Board,
  player1Inventory: PlayerInventory,
  player2Inventory: PlayerInventory
): boolean {
  // Check if both players have no pieces left
  const player1HasPieces = Object.values(player1Inventory).some(count => count > 0);
  const player2HasPieces = Object.values(player2Inventory).some(count => count > 0);

  if (!player1HasPieces && !player2HasPieces) {
    return true;
  }

  // Check if board is full
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col].piece === PieceType.EMPTY) {
        return false;
      }
    }
  }

  return true;
}
