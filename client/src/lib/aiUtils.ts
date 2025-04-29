import { Board, Cell, PieceType, Player, PlayerInventory, Position } from './types';
import { isValidMove, determineWinner, getRandomPiece } from './gameUtils';

// AI difficulty levels
export enum AIDifficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

// Calculate score for move based on various factors
const evaluateMove = (
  board: Board, 
  position: Position, 
  piece: PieceType, 
  player: Player,
  captured: boolean
): number => {
  let score = 0;
  const { row, col } = position;
  
  // Base score for each move
  if (captured) {
    // Capturing an opponent's piece is valuable
    score += 5;
    
    // The piece captured
    const capturedPiece = board[row][col].piece;
    if (capturedPiece === PieceType.SCISSORS) score += 2;
    if (capturedPiece === PieceType.PAPER) score += 2;
    if (capturedPiece === PieceType.ROCK) score += 2;
  }
  
  // Position-based scoring
  // Center positions are generally more valuable
  const centerProximity = Math.abs(row - 2.5) + Math.abs(col - 2.5);
  score += (5 - centerProximity) * 0.5;
  
  // Check if the move creates a potential win (4 in a row)
  // This is a simplified check - a real implementation would be more extensive
  const directions = [
    { dr: 0, dc: 1 }, // horizontal
    { dr: 1, dc: 0 }, // vertical
    { dr: 1, dc: 1 }, // diagonal down-right
    { dr: 1, dc: -1 } // diagonal down-left
  ];
  
  for (const { dr, dc } of directions) {
    let count = 1; // count the piece we're placing
    
    // Check in both directions
    for (let sign of [1, -1]) {
      for (let i = 1; i <= 4; i++) { // Look up to 4 pieces away
        const r = row + sign * i * dr;
        const c = col + sign * i * dc;
        
        // Stop if we're off the board
        if (r < 0 || r >= 6 || c < 0 || c >= 6) break;
        
        // Count consecutive pieces
        if (board[r][c].owner === player) {
          count++;
        } else {
          break;
        }
      }
    }
    
    // Award points based on consecutive pieces
    if (count >= 2) score += count * 2;
    if (count >= 3) score += 5; // Bonus for 3 in a row
    if (count >= 4) score += 30; // Big bonus for 4 in a row (potential win next move)
  }
  
  // Defensive scoring - block opponent's potential win
  // Implementation would mirror the above win check but for the opponent
  
  return score;
};

// Find the best move for the AI based on the current board state
export const findBestMove = (
  board: Board, 
  inventory: PlayerInventory, 
  difficulty: AIDifficulty
): { position: Position; piece: PieceType } | null => {
  const emptyPositions: Position[] = [];
  const opponentPiecePositions: Position[] = [];
  
  // Find all empty cells and opponent pieces
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 6; col++) {
      const cell = board[row][col];
      
      if (cell.piece === PieceType.EMPTY) {
        emptyPositions.push({ row, col });
      } else if (cell.owner === Player.PLAYER1) {
        opponentPiecePositions.push({ row, col });
      }
    }
  }
  
  // No valid moves
  if (emptyPositions.length === 0 && opponentPiecePositions.length === 0) {
    return null;
  }
  
  // Get available pieces from inventory
  const availablePieces: PieceType[] = [];
  if (inventory[PieceType.ROCK] > 0) availablePieces.push(PieceType.ROCK);
  if (inventory[PieceType.PAPER] > 0) availablePieces.push(PieceType.PAPER);
  if (inventory[PieceType.SCISSORS] > 0) availablePieces.push(PieceType.SCISSORS);
  if (inventory[PieceType.SPECIAL] > 0) availablePieces.push(PieceType.SPECIAL);
  
  // No pieces left
  if (availablePieces.length === 0) {
    return null;
  }
  
  // Generate all possible moves
  type Move = { position: Position; piece: PieceType; score: number };
  const possibleMoves: Move[] = [];
  
  // Try placing pieces on empty cells
  for (const position of emptyPositions) {
    for (const piece of availablePieces) {
      // Special piece can only go on empty cells, already handled here
      const score = evaluateMove(board, position, piece, Player.PLAYER2, false);
      possibleMoves.push({ position, piece, score });
    }
  }
  
  // Try capturing opponent pieces
  for (const position of opponentPiecePositions) {
    const targetCell = board[position.row][position.col];
    
    // Can't capture special pieces
    if (targetCell.piece === PieceType.SPECIAL) continue;
    
    for (const piece of availablePieces) {
      // Special piece can't capture
      if (piece === PieceType.SPECIAL) continue;
      
      // Check if this piece can capture the opponent's piece
      if (isValidMove(board, position, piece, Player.PLAYER2)) {
        const score = evaluateMove(board, position, piece, Player.PLAYER2, true);
        possibleMoves.push({ position, piece, score });
      }
    }
  }
  
  // No valid moves found
  if (possibleMoves.length === 0) {
    return null;
  }
  
  // Sort moves by score (best first)
  possibleMoves.sort((a, b) => b.score - a.score);
  
  // Adjust AI behavior based on difficulty level
  switch (difficulty) {
    case AIDifficulty.EASY:
      // Easy AI chooses randomly among top 70% of moves
      const easyIndex = Math.floor(Math.random() * Math.ceil(possibleMoves.length * 0.7));
      return {
        position: possibleMoves[easyIndex].position,
        piece: possibleMoves[easyIndex].piece
      };
      
    case AIDifficulty.MEDIUM:
      // Medium AI chooses randomly among top 30% of moves
      const mediumIndex = Math.floor(Math.random() * Math.ceil(possibleMoves.length * 0.3));
      return {
        position: possibleMoves[mediumIndex].position,
        piece: possibleMoves[mediumIndex].piece
      };
      
    case AIDifficulty.HARD:
    default:
      // Hard AI always chooses the best move
      return {
        position: possibleMoves[0].position,
        piece: possibleMoves[0].piece
      };
  }
};
