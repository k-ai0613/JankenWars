import { Board, Cell, PieceType, Player, PlayerInventory, Position } from './types';
import { isValidMove, determineWinner, getRandomPiece } from './gameUtils';

// AI difficulty levels
export enum AIDifficulty {
  BEGINNER = 'BEGINNER',  // Completely new player level
  EASY = 'EASY',          // Easy difficulty
  NORMAL = 'NORMAL',      // Normal difficulty
  MEDIUM = 'MEDIUM',      // Medium difficulty 
  HARD = 'HARD',          // Hard difficulty
  EXPERT = 'EXPERT'       // Expert difficulty, very challenging
}

// Enhanced evaluation function for AI move scoring
const evaluateMove = (
  board: Board, 
  position: Position, 
  piece: PieceType, 
  player: Player,
  captured: boolean
): number => {
  let score = 0;
  const { row, col } = position;
  const opponent = player === Player.PLAYER1 ? Player.PLAYER2 : Player.PLAYER1;
  
  // ===== OFFENSIVE SCORING =====
  
  // Base score for each move
  if (captured) {
    // Capturing an opponent's piece is highly valuable
    score += 12;
    
    // The piece captured - some pieces may be worth more
    const capturedPiece = board[row][col].piece;
    if (capturedPiece === PieceType.SCISSORS) score += 4;
    if (capturedPiece === PieceType.PAPER) score += 4;
    if (capturedPiece === PieceType.ROCK) score += 4;
    
    // Capturing pieces that are part of a potential winning line is even more valuable
    const captureImportance = evaluatePositionImportance(board, position, opponent);
    score += captureImportance * 8; // Heavily weight capturing strategically important pieces
  }
  
  // ===== POSITIONAL SCORING =====
  
  // Strategic position scoring - center control is valuable
  // Center positions are generally more valuable for board control
  const centerProximity = Math.abs(row - 2.5) + Math.abs(col - 2.5);
  score += (5 - centerProximity) * 2; // Increased weight for center control
  
  // Corner and edge placements are generally less useful unless part of a line
  const isCorner = (row === 0 || row === 5) && (col === 0 || col === 5);
  const isEdge = row === 0 || row === 5 || col === 0 || col === 5;
  
  if (isCorner) score -= 3; // Penalty for corner unless it helps form a line
  else if (isEdge) score -= 1; // Smaller penalty for edges
  
  // ===== OFFENSIVE LINE FORMATION SCORING =====
  
  // Check if the move creates a potential win
  const directions = [
    { dr: 0, dc: 1 }, // horizontal
    { dr: 1, dc: 0 }, // vertical
    { dr: 1, dc: 1 }, // diagonal down-right
    { dr: 1, dc: -1 } // diagonal down-left
  ];
  
  for (const { dr, dc } of directions) {
    let count = 1; // count the piece we're placing
    let openEnds = 0; // Open ends make the line more valuable (harder to block)
    
    // Check in both directions
    for (let sign of [1, -1]) {
      // First check for open end before our pieces
      const r_open = row + sign * dr;
      const c_open = col + sign * dc;
      
      if (r_open >= 0 && r_open < 6 && c_open >= 0 && c_open < 6 && 
          board[r_open][c_open].piece === PieceType.EMPTY) {
        openEnds++;
      }
      
      // Now count our consecutive pieces
      for (let i = 1; i <= 4; i++) { // Look up to 4 pieces away
        const r = row + sign * i * dr;
        const c = col + sign * i * dc;
        
        // Stop if we're off the board
        if (r < 0 || r >= 6 || c < 0 || c >= 6) break;
        
        // Count consecutive pieces
        if (board[r][c].owner === player) {
          count++;
        } else if (board[r][c].piece === PieceType.EMPTY) {
          // Found an empty space after our pieces - this is another open end
          openEnds++;
          break;
        } else {
          // Found opponent's piece - line is blocked in this direction
          break;
        }
      }
    }
    
    // Award points based on consecutive pieces and open ends
    if (count >= 2) score += count * 3; // Base score for a line
    if (count >= 3) score += 10; // Bonus for 3 in a row
    if (count >= 4) score += 50; // Big bonus for 4 in a row (potential win next move)
    
    // Lines with open ends are more valuable - they can be extended
    score += openEnds * count * 2; // Reward open-ended lines more
    
    // A line with pieces that already has 4 in a row is a winning move
    if (count >= 5) score += 1000; // Immediate win
  }
  
  // ===== DEFENSIVE SCORING =====
  
  // Check if this move blocks an opponent's potential win
  const defensiveScore = calculateDefensiveValue(board, position, opponent);
  score += defensiveScore * 0.8; // Defense is slightly less valuable than offense
  
  // ===== SPECIAL PIECE STRATEGY =====
  
  // Special strategy for special pieces - they can't be captured
  if (piece === PieceType.SPECIAL) {
    // Place special pieces strategically to block or support lines
    // Check if this position is critical for opponent or helps our own line
    const opponentImportance = evaluatePositionImportance(board, position, opponent);
    const playerImportance = evaluatePositionImportance(board, position, player);
    
    score += Math.max(opponentImportance, playerImportance) * 5;
    
    // Avoid wasting special pieces on low-value positions
    if (opponentImportance < 3 && playerImportance < 3) {
      score -= 10; // Penalty for using special piece in non-critical position
    }
  }
  
  return score;
};

// Helper function to calculate how important a position is for blocking opponent
const calculateDefensiveValue = (board: Board, position: Position, opponent: Player): number => {
  let defensiveScore = 0;
  const { row, col } = position;
  
  // Check in all directions for opponent's pieces that could form a winning line
  const directions = [
    { dr: 0, dc: 1 }, // horizontal
    { dr: 1, dc: 0 }, // vertical
    { dr: 1, dc: 1 }, // diagonal down-right
    { dr: 1, dc: -1 } // diagonal down-left
  ];
  
  for (const { dr, dc } of directions) {
    let opponentCount = 0;
    let openEnds = 0;
    
    // Check in both directions
    for (let sign of [1, -1]) {
      for (let i = 1; i <= 4; i++) {
        const r = row + sign * i * dr;
        const c = col + sign * i * dc;
        
        if (r < 0 || r >= 6 || c < 0 || c >= 6) break;
        
        if (board[r][c].owner === opponent) {
          opponentCount++;
        } else if (board[r][c].piece === PieceType.EMPTY) {
          openEnds++;
          break;
        } else {
          break;
        }
      }
    }
    
    // Blocking opponent's line becomes increasingly important as they get closer to winning
    if (opponentCount >= 2) defensiveScore += opponentCount * 5;
    if (opponentCount >= 3) defensiveScore += 15; // Critical to block 3 in a row
    if (opponentCount >= 4) defensiveScore += 80; // Extremely critical to block 4 in a row
    
    // Open-ended opponent lines are more dangerous
    defensiveScore += openEnds * opponentCount * 3;
  }
  
  return defensiveScore;
};

// Helper function to evaluate how important a position is strategically
const evaluatePositionImportance = (board: Board, position: Position, player: Player): number => {
  let importance = 0;
  const { row, col } = position;
  
  // Check in all directions for player's pieces that could form a winning line
  const directions = [
    { dr: 0, dc: 1 }, // horizontal
    { dr: 1, dc: 0 }, // vertical
    { dr: 1, dc: 1 }, // diagonal down-right
    { dr: 1, dc: -1 } // diagonal down-left
  ];
  
  for (const { dr, dc } of directions) {
    let playerPieces = 0;
    let emptySpaces = 0;
    
    // Look in a 5-cell window centered on this position
    for (let i = -2; i <= 2; i++) {
      const r = row + i * dr;
      const c = col + i * dc;
      
      if (r < 0 || r >= 6 || c < 0 || c >= 6) continue;
      
      if (board[r][c].owner === player) {
        playerPieces++;
      } else if (board[r][c].piece === PieceType.EMPTY) {
        emptySpaces++;
      }
    }
    
    // The more player pieces and empty spaces in this line, the more important it is
    if (playerPieces >= 2 && emptySpaces >= 1) {
      importance += playerPieces * 2;
      
      // If there are 3 or 4 pieces already, this position becomes very important
      if (playerPieces >= 3) importance += 5;
      if (playerPieces >= 4) importance += 10;
    }
  }
  
  return importance;
};

// Debug helper to log the AI operation
const debugLogAI = (message: string, data: any) => {
  // console.log(`[AI Debug] ${message}`, data); // ログ出力を停止
};

export const findBestPosition = (
  board: Board,
  piece: PieceType,
  difficulty: AIDifficulty
): Position | null => {
  debugLogAI('Finding best position for piece', { piece, difficulty });
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
  
  // No valid positions
  if (emptyPositions.length === 0 && opponentPiecePositions.length === 0) {
    return null;
  }
  
  // Generate all possible positions
  type Move = { position: Position; score: number };
  const possibleMoves: Move[] = [];
  
  // Try placing the piece on empty cells
  for (const position of emptyPositions) {
    // Special piece can only go on empty cells
    const score = evaluateMove(board, position, piece, Player.PLAYER2, false);
    possibleMoves.push({ position, score });
  }
  
  // Try capturing opponent pieces (if not a special piece)
  if (piece !== PieceType.SPECIAL) {
    for (const position of opponentPiecePositions) {
      const targetCell = board[position.row][position.col];
      
      // Can't capture special pieces
      if (targetCell.piece === PieceType.SPECIAL) continue;
      
      // Check if this piece can capture the opponent's piece
      if (isValidMove(board, position, piece, Player.PLAYER2)) {
        const score = evaluateMove(board, position, piece, Player.PLAYER2, true);
        possibleMoves.push({ position, score });
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
    case AIDifficulty.BEGINNER:
      // Beginner AI chooses randomly among top 90% of moves - still makes obvious mistakes
      const beginnerIndex = Math.floor(Math.random() * Math.ceil(possibleMoves.length * 0.9));
      return possibleMoves[beginnerIndex].position;
      
    case AIDifficulty.EASY:
      // Easy AI chooses randomly among top 70% of moves - plays reasonably but misses opportunities
      const easyIndex = Math.floor(Math.random() * Math.ceil(possibleMoves.length * 0.7));
      return possibleMoves[easyIndex].position;
    
    case AIDifficulty.NORMAL:
      // Normal AI chooses randomly among top 50% of moves - plays solidly
      const normalIndex = Math.floor(Math.random() * Math.ceil(possibleMoves.length * 0.5));
      return possibleMoves[normalIndex].position;
      
    case AIDifficulty.MEDIUM:
      // Medium AI chooses randomly among top 30% of moves - strong play
      const mediumIndex = Math.floor(Math.random() * Math.ceil(possibleMoves.length * 0.3));
      return possibleMoves[mediumIndex].position;
      
    case AIDifficulty.HARD:
      // Hard AI chooses randomly among top 10% of moves - very challenging
      const hardIndex = Math.floor(Math.random() * Math.ceil(Math.max(possibleMoves.length * 0.1, 1)));
      return possibleMoves[hardIndex].position;
      
    case AIDifficulty.EXPERT:
      // Expert AI always chooses the absolute best move - extremely difficult
      // And adds some extra strategy by looking even further ahead (simulated by always taking best move)
      return possibleMoves[0].position;
      
    default:
      // Default to normal difficulty
      const defaultIndex = Math.floor(Math.random() * Math.ceil(possibleMoves.length * 0.5));
      return possibleMoves[defaultIndex].position;
  }
};

// This function is kept for backward compatibility
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
    case AIDifficulty.BEGINNER:
      // Beginner AI chooses randomly among top 90% of moves - still makes obvious mistakes
      const beginnerIndex = Math.floor(Math.random() * Math.ceil(possibleMoves.length * 0.9));
      return {
        position: possibleMoves[beginnerIndex].position,
        piece: possibleMoves[beginnerIndex].piece
      };
      
    case AIDifficulty.EASY:
      // Easy AI chooses randomly among top 70% of moves - plays reasonably but misses opportunities
      const easyIndex = Math.floor(Math.random() * Math.ceil(possibleMoves.length * 0.7));
      return {
        position: possibleMoves[easyIndex].position,
        piece: possibleMoves[easyIndex].piece
      };
    
    case AIDifficulty.NORMAL:
      // Normal AI chooses randomly among top 50% of moves - plays solidly
      const normalIndex = Math.floor(Math.random() * Math.ceil(possibleMoves.length * 0.5));
      return {
        position: possibleMoves[normalIndex].position,
        piece: possibleMoves[normalIndex].piece
      };
      
    case AIDifficulty.MEDIUM:
      // Medium AI chooses randomly among top 30% of moves - strong play
      const mediumIndex = Math.floor(Math.random() * Math.ceil(possibleMoves.length * 0.3));
      return {
        position: possibleMoves[mediumIndex].position,
        piece: possibleMoves[mediumIndex].piece
      };
      
    case AIDifficulty.HARD:
      // Hard AI chooses randomly among top 10% of moves - very challenging
      const hardIndex = Math.floor(Math.random() * Math.ceil(Math.max(possibleMoves.length * 0.1, 1)));
      return {
        position: possibleMoves[hardIndex].position,
        piece: possibleMoves[hardIndex].piece
      };
      
    case AIDifficulty.EXPERT:
      // Expert AI always chooses the absolute best move - extremely difficult
      // And adds some extra strategy by looking even further ahead (simulated by always taking best move)
      return {
        position: possibleMoves[0].position,
        piece: possibleMoves[0].piece
      };
      
    default:
      // Default to normal difficulty
      const defaultIndex = Math.floor(Math.random() * Math.ceil(possibleMoves.length * 0.5));
      return {
        position: possibleMoves[defaultIndex].position,
        piece: possibleMoves[defaultIndex].piece
      };
  }
};
