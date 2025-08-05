import { Board, Cell, GameResult, PieceType, Player, PlayerInventory, Position, WinningLine } from './types';

// Type guard to check if a piece is a combat piece (Rock, Paper, or Scissors)
function isCombatPiece(piece: PieceType | null): piece is PieceType.ROCK | PieceType.PAPER | PieceType.SCISSORS {
  return piece === PieceType.ROCK || piece === PieceType.PAPER || piece === PieceType.SCISSORS;
}

// Cell selection utility for online games
export const selectCellForPlayer = (
  position: Position,
  player: Player,
  piece: PieceType | null,
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

  // Attacking piece must be a combat piece (ROCK, PAPER, SCISSORS)
  // EMPTY pieces cannot attack an occupied cell.
  if (piece === PieceType.EMPTY) {
    return board; // No change
  }
  // null pieces cannot attack an occupied cell.
  if (piece === null) {
    return board; // No change
  }
  
  // Calculate if attacking piece wins
  // Ensure piece is a combat piece (ROCK, PAPER, SCISSORS) and not null before calling determineWinner
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
  // console.log('[CREATE_BOARD] Generated completely new empty board');
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

// 勝利ラインを検出して返す関数
export const findWinningLine = (board: Board, player: Player): WinningLine | null => {
  // Check horizontal
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col <= 2; col++) {
      let consecutive = 0;
      const positions: Position[] = [];
      
      // 4つの連続をチェック
      for (let i = 0; i < 4; i++) {
        if (board[row][col + i].owner === player) {
          consecutive++;
          positions.push({ row, col: col + i });
        } else {
          consecutive = 0;
          positions.length = 0; // 配列をクリア
          break;
        }
      }
      
      // 4つ連続していれば勝利ライン
      if (consecutive === 4) {
        return { positions, player };
      }
    }
  }

  // Check vertical
  for (let col = 0; col < 6; col++) {
    for (let row = 0; row <= 2; row++) {
      let consecutive = 0;
      const positions: Position[] = [];
      
      // 4つの連続をチェック
      for (let i = 0; i < 4; i++) {
        if (board[row + i][col].owner === player) {
          consecutive++;
          positions.push({ row: row + i, col });
        } else {
          consecutive = 0;
          positions.length = 0; // 配列をクリア
          break;
        }
      }
      
      // 4つ連続していれば勝利ライン
      if (consecutive === 4) {
        return { positions, player };
      }
    }
  }

  // Check diagonal (top-left to bottom-right)
  for (let row = 0; row <= 2; row++) {
    for (let col = 0; col <= 2; col++) {
      let consecutive = 0;
      const positions: Position[] = [];
      
      // 4つの連続をチェック
      for (let i = 0; i < 4; i++) {
        if (row + i < 6 && col + i < 6 && board[row + i][col + i].owner === player) {
          consecutive++;
          positions.push({ row: row + i, col: col + i });
        } else {
          consecutive = 0;
          positions.length = 0; // 配列をクリア
          break;
        }
      }
      
      // 4つ連続していれば勝利ライン
      if (consecutive === 4) {
        return { positions, player };
      }
    }
  }

  // Check diagonal (top-right to bottom-left)
  for (let row = 0; row <= 2; row++) {
    for (let col = 3; col < 6; col++) {
      let consecutive = 0;
      const positions: Position[] = [];
      
      // 4つの連続をチェック
      for (let i = 0; i < 4; i++) {
        if (row + i < 6 && col - i >= 0 && board[row + i][col - i].owner === player) {
          consecutive++;
          positions.push({ row: row + i, col: col - i });
        } else {
          consecutive = 0;
          positions.length = 0; // 配列をクリア
          break;
        }
      }
      
      // 4つ連続していれば勝利ライン
      if (consecutive === 4) {
        return { positions, player };
      }
    }
  }

  // 勝利ラインなし
  return null;
};

// Checks if there are 4 in a row for the given player
export const checkWin = (board: Board, player: Player): boolean => {
  return findWinningLine(board, player) !== null;
};

// Determine the winner based on Rock-Paper-Scissors rules (Japanese Janken rules)
// IMPORTANT: This function always returns Player.PLAYER1 when the attacker wins
// and Player.PLAYER2 when the defender wins, regardless of which actual player is attacking/defending
export const determineWinner = (
  attackingPiece: PieceType | null,
  defendingPiece: PieceType | null // defendingPiece も null を許容するように変更
): Player => {
  // attackingPiece が null または戦闘駒でない場合は、勝者なしとする
  if (!isCombatPiece(attackingPiece)) {
    return Player.NONE;
  }

  // defendingPiece が null または戦闘駒でない場合も、勝者なしとする
  if (!isCombatPiece(defendingPiece)) {
    return Player.NONE;
  }

  // 両方の駒が戦闘駒（グー、チョキ、パー）の場合にのみ勝敗判定
  if (attackingPiece === defendingPiece) {
    // 同じ駒同士は引き分け (攻撃側の負け扱い)
    return Player.PLAYER2;
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

  // All other combinations result in the defender winning
  return Player.PLAYER2;
};

// Check if the position is valid for placing a piece
export const isValidMove = (
  board: Board, 
  position: Position, 
  selectedPiece: PieceType | null,
  currentPlayer: Player
): boolean => {
  console.log(`[isValidMove] Checking move at (${position.row}, ${position.col}) with piece ${selectedPiece} for player ${currentPlayer}`);
  
  const { row, col } = position;
  
  // If the position is out of bounds, it's invalid
  if (row < 0 || row >= 6 || col < 0 || col >= 6) {
    console.log('[isValidMove] Invalid: Position is out of bounds');
    return false;
  }
  
  const targetCell = board[row][col];
  console.log('[isValidMove] Target cell:', targetCell);
  
  // If no piece is selected, can't make a move
  if (selectedPiece === null) {
    console.log('[isValidMove] Invalid: No piece selected');
    return false;
  }
  
  // If the cell has been locked (used in janken battle), it's invalid
  if (targetCell.hasBeenUsed) {
    console.log('[isValidMove] Invalid: Cell has been used in janken battle');
    return false;
  }
  
  // If the target cell is empty, it's a valid move
  if (targetCell.piece === PieceType.EMPTY) {
    console.log('[isValidMove] Valid: Cell is empty');
    return true;
  }
  
  // Special piece can only be placed on empty cells
  if (selectedPiece === PieceType.SPECIAL) {
    console.log('[isValidMove] Invalid: Special piece can only be placed on empty cells');
    return false;
  }
  
  // If the target cell is owned by the current player, it's invalid
  if (targetCell.owner === currentPlayer) {
    console.log('[isValidMove] Invalid: Cell already owned by current player');
    return false;
  }
  
  // If the target cell has a special piece, it's invalid
  if (targetCell.piece === PieceType.SPECIAL) {
    console.log('[isValidMove] Invalid: Cannot capture a special piece');
    return false;
  }
  
  // EMPTY pieces cannot attack an occupied cell
  if (selectedPiece === PieceType.EMPTY) {
    console.log('[isValidMove] Invalid: Cannot attack with an EMPTY piece');
    return false;
  }
  
  // Otherwise, it's valid if the current player's piece can win against the target piece
  // Ensure selectedPiece is a combat piece and not null before calling determineWinner
  const attackingResult = determineWinner(selectedPiece, targetCell.piece);
  const isValid = attackingResult === Player.PLAYER1; // PLAYER1 means attacker wins
  
  console.log(`[isValidMove] Janken battle result: ${isValid ? 'Attacker wins' : 'Defender wins'} (${selectedPiece} vs ${targetCell.piece})`);
  return isValid;
};
