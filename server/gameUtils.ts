import { Board, Cell, Player, PieceType, PlayerInventory, Position, WinningLine } from "./types.js";

export function createEmptyBoard(): Board {
  const board: Board = [];
  for (let row = 0; row < 7; row++) {
    board[row] = [];
    for (let col = 0; col < 7; col++) {
      board[row][col] = {
        piece: PieceType.EMPTY,
        owner: null,
        hasBeenUsed: false,
      };
    }
  }
  return board;
}

export function createInitialInventory(): PlayerInventory {
  return {
    rock: 2,
    paper: 2,
    scissors: 2,
    flag: 2,
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
  if (row < 0 || row >= 7 || col < 0 || col >= 7) {
    return false;
  }

  const cell = board[row][col];
  
  // Can place on empty cell
  if (cell.piece === PieceType.EMPTY) {
    return true;
  }

  // Can capture opponent's piece
  if (cell.owner !== player) {
    return true;
  }

  return false;
}

export function checkWin(board: Board, player: Player): boolean {
  return findWinningLine(board, player) !== null;
}

export function findWinningLine(board: Board, player: Player): WinningLine | null {
  // Check horizontal lines
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col <= 7 - 4; col++) {
      let count = 0;
      for (let i = 0; i < 4; i++) {
        if (board[row][col + i].owner === player && board[row][col + i].piece !== PieceType.EMPTY) {
          count++;
        }
      }
      if (count === 4) {
        return {
          start: { row, col },
          end: { row, col: col + 3 },
          direction: 'horizontal'
        };
      }
    }
  }

  // Check vertical lines
  for (let row = 0; row <= 7 - 4; row++) {
    for (let col = 0; col < 7; col++) {
      let count = 0;
      for (let i = 0; i < 4; i++) {
        if (board[row + i][col].owner === player && board[row + i][col].piece !== PieceType.EMPTY) {
          count++;
        }
      }
      if (count === 4) {
        return {
          start: { row, col },
          end: { row: row + 3, col },
          direction: 'vertical'
        };
      }
    }
  }

  // Check diagonal lines (top-left to bottom-right)
  for (let row = 0; row <= 7 - 4; row++) {
    for (let col = 0; col <= 7 - 4; col++) {
      let count = 0;
      for (let i = 0; i < 4; i++) {
        if (board[row + i][col + i].owner === player && board[row + i][col + i].piece !== PieceType.EMPTY) {
          count++;
        }
      }
      if (count === 4) {
        return {
          start: { row, col },
          end: { row: row + 3, col: col + 3 },
          direction: 'diagonal'
        };
      }
    }
  }

  // Check diagonal lines (top-right to bottom-left)
  for (let row = 0; row <= 7 - 4; row++) {
    for (let col = 3; col < 7; col++) {
      let count = 0;
      for (let i = 0; i < 4; i++) {
        if (board[row + i][col - i].owner === player && board[row + i][col - i].piece !== PieceType.EMPTY) {
          count++;
        }
      }
      if (count === 4) {
        return {
          start: { row, col },
          end: { row: row + 3, col: col - 3 },
          direction: 'diagonal'
        };
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
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 7; col++) {
      if (board[row][col].piece === PieceType.EMPTY) {
        return false;
      }
    }
  }
  
  return true;
}