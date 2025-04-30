import { Board, Cell, GameResult, PieceType, Player, PlayerInventory, Position } from './types';

// Cell selection utility for online games
export const selectCellForPlayer = (
  position: Position,
  player: Player,
  piece: PieceType,
  board: Board
): Board => {
  const { row, col } = position;
  const newBoard = [...board.map(r => [...r.map(c => ({...c}))])]; // Deep copy
  
  const targetCell = newBoard[row][col];
  
  // If cell is empty, place the piece
  if (targetCell.piece === PieceType.EMPTY) {
    targetCell.piece = piece;
    targetCell.owner = player;
    return newBoard;
  }
  
  // Special piece can't be used to capture
  if (piece === PieceType.SPECIAL) {
    return board; // No change
  }
  
  // Cannot capture own pieces
  if (targetCell.owner === player) {
    return board; // No change
  }
  
  // Can't capture special pieces
  if (targetCell.piece === PieceType.SPECIAL) {
    return board; // No change
  }
  
  // Calculate if attacking piece wins
  const attackResult = determineWinner(piece, targetCell.piece);
  
  // If attacker wins, replace the piece and mark as used
  if (attackResult === Player.PLAYER1) { // PLAYER1 means attacker wins
    targetCell.piece = piece;
    targetCell.owner = player;
    targetCell.hasBeenUsed = true; // Lock the cell after Janken battle
  }
  
  return newBoard;
};

// Create an empty 6x6 board
export const createEmptyBoard = (): Board => {
  // 完全にクリーンな盤面を作成（常に新しいオブジェクトを生成）
  const board: Board = [];
  for (let i = 0; i < 6; i++) {
    const row: Cell[] = [];
    for (let j = 0; j < 6; j++) {
      // 各セルを完全新規に作成し直す
      const cell: Cell = { 
        piece: PieceType.EMPTY, 
        owner: Player.NONE, // Explicitly set to NONE for all empty cells
        hasBeenUsed: false  // 特に重要: 必ずfalseにリセット
      };
      row.push(cell);
    }
    board.push(row);
  }
  console.log('[CREATE_BOARD] Generated completely new empty board');
  return board;
};

// Create initial inventory for a player (7 of each normal piece, 1 special)
export const createInitialInventory = (): PlayerInventory => {
  return {
    [PieceType.ROCK]: 7,
    [PieceType.PAPER]: 7,
    [PieceType.SCISSORS]: 7,
    [PieceType.SPECIAL]: 1,
  };
};

// Get random piece from inventory (excluding SPECIAL)
export const getRandomPiece = (inventory: PlayerInventory): PieceType | null => {
  // Calculate total available normal pieces
  let availablePieces: PieceType[] = [];
  
  // Add each piece type to the available pieces array based on inventory count
  if (inventory[PieceType.ROCK] > 0) {
    availablePieces.push(PieceType.ROCK);
  }
  if (inventory[PieceType.PAPER] > 0) {
    availablePieces.push(PieceType.PAPER);
  }
  if (inventory[PieceType.SCISSORS] > 0) {
    availablePieces.push(PieceType.SCISSORS);
  }
  
  // If no pieces available, return null
  if (availablePieces.length === 0) {
    return null;
  }
  
  // Return a random piece from available pieces
  const randomIndex = Math.floor(Math.random() * availablePieces.length);
  return availablePieces[randomIndex];
};

// Check if the game is a draw (all pieces placed or no valid moves left)
export const checkDraw = (
  board: Board, 
  player1Inventory: PlayerInventory, 
  player2Inventory: PlayerInventory
): boolean => {
  // Check if any empty cells on the board
  const hasEmptyCell = board.some(row => 
    row.some(cell => cell.piece === PieceType.EMPTY)
  );
  
  // If no empty cells, check if any pieces left in inventory
  if (!hasEmptyCell) {
    return true;
  }
  
  // Check if both players have no pieces left
  const player1HasPieces = Object.values(player1Inventory).some(count => count > 0);
  const player2HasPieces = Object.values(player2Inventory).some(count => count > 0);
  
  return !player1HasPieces && !player2HasPieces;
};

// Checks if there are 5 in a row for the given player
export const checkWin = (board: Board, player: Player): boolean => {
  // Check horizontal
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col <= 1; col++) {
      let consecutive = 0;
      for (let i = 0; i < 5; i++) {
        if (board[row][col + i].owner === player) {
          consecutive++;
        } else {
          consecutive = 0;
          break;
        }
      }
      if (consecutive === 5) return true;
    }
  }

  // Check vertical
  for (let col = 0; col < 6; col++) {
    for (let row = 0; row <= 1; row++) {
      let consecutive = 0;
      for (let i = 0; i < 5; i++) {
        if (board[row + i][col].owner === player) {
          consecutive++;
        } else {
          consecutive = 0;
          break;
        }
      }
      if (consecutive === 5) return true;
    }
  }

  // Check diagonal (top-left to bottom-right)
  for (let row = 0; row <= 1; row++) {
    for (let col = 0; col <= 1; col++) {
      let consecutive = 0;
      for (let i = 0; i < 5; i++) {
        if (board[row + i][col + i].owner === player) {
          consecutive++;
        } else {
          consecutive = 0;
          break;
        }
      }
      if (consecutive === 5) return true;
    }
  }

  // Check diagonal (top-right to bottom-left)
  for (let row = 0; row <= 1; row++) {
    for (let col = 4; col < 6; col++) {
      let consecutive = 0;
      for (let i = 0; i < 5; i++) {
        if (board[row + i][col - i].owner === player) {
          consecutive++;
        } else {
          consecutive = 0;
          break;
        }
      }
      if (consecutive === 5) return true;
    }
  }

  return false;
};

// Determine the winner based on Rock-Paper-Scissors rules (Japanese Janken rules)
// IMPORTANT: This function always returns Player.PLAYER1 when the attacker wins
// and Player.PLAYER2 when the defender wins, regardless of which actual player is attacking/defending
export const determineWinner = (attackingPiece: PieceType, defendingPiece: PieceType): Player => {
  // Special piece can't attack or be attacked
  if (attackingPiece === PieceType.SPECIAL || defendingPiece === PieceType.SPECIAL) {
    return Player.NONE;
  }
  
  // Rock (グー) beats Scissors (チョキ)
  if (attackingPiece === PieceType.ROCK && defendingPiece === PieceType.SCISSORS) {
    return Player.PLAYER1;
  }
  
  // Scissors (チョキ) beats Paper (パー)
  if (attackingPiece === PieceType.SCISSORS && defendingPiece === PieceType.PAPER) {
    return Player.PLAYER1;
  }
  
  // Paper (パー) beats Rock (グー)
  if (attackingPiece === PieceType.PAPER && defendingPiece === PieceType.ROCK) {
    return Player.PLAYER1;
  }
  
  // If defending piece wins or it's a tie (same piece types)
  return Player.PLAYER2;
};

// Check if the position is valid for placing a piece
export const isValidMove = (
  board: Board, 
  position: Position, 
  selectedPiece: PieceType, 
  currentPlayer: Player
): boolean => {
  const { row, col } = position;
  
  // If the position is out of bounds, it's invalid
  if (row < 0 || row >= 6 || col < 0 || col >= 6) {
    return false;
  }
  
  const targetCell = board[row][col];
  
  // If the cell has been locked (used in janken battle), it's invalid
  if (targetCell.hasBeenUsed) {
    return false;
  }
  
  // If the target cell is empty, it's a valid move
  if (targetCell.piece === PieceType.EMPTY) {
    return true;
  }
  
  // Special piece can only be placed on empty cells
  if (selectedPiece === PieceType.SPECIAL) {
    return false;
  }
  
  // If the target cell is owned by the current player, it's invalid
  if (targetCell.owner === currentPlayer) {
    return false;
  }
  
  // If the target cell has a special piece, it's invalid
  if (targetCell.piece === PieceType.SPECIAL) {
    return false;
  }
  
  // Otherwise, it's valid if the current player's piece can win against the target piece
  // In Japanese Janken Rules:
  // - Rock (グー) beats Scissors (チョキ)
  // - Scissors (チョキ) beats Paper (パー)
  // - Paper (パー) beats Rock (グー)
  // In determineWinner(), Player.PLAYER1 always represents the attacker, regardless of actual player
  const attackingResult = determineWinner(selectedPiece, targetCell.piece);
  return attackingResult === Player.PLAYER1; // PLAYER1 means attacker wins, not necessarily that Player 1 wins
};
