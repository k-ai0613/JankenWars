// Client-side game logic.
//
// The rules live in shared/gameRules.ts and are the exact same code the server
// runs to validate moves. Only client-specific helpers are declared here.

import { applyMove, isValidMove } from '@shared/gameRules';
import { PieceType } from '@shared/gameTypes';
import type { Board, PlayerInventory, Player, Position } from '@shared/gameTypes';

export {
  BOARD_SIZE,
  WIN_LENGTH,
  INITIAL_PIECE_COUNT,
  INITIAL_SPECIAL_COUNT,
  createEmptyBoard,
  createInitialInventory,
  cloneBoard,
  isWithinBoard,
  attackerWins,
  determineWinner,
  isValidMove,
  applyMove,
  findWinningLine,
  checkWin,
  checkDraw,
} from '@shared/gameRules';

export type { AppliedMove } from '@shared/gameRules';

/**
 * Place a piece and return the resulting board.
 *
 * Returns the original board unchanged when the move is not legal, so callers
 * that have not already validated stay safe.
 */
export const selectCellForPlayer = (
  position: Position,
  player: Player,
  piece: PieceType | null,
  board: Board,
): Board => {
  if (piece === null || !isValidMove(board, position, piece, player)) {
    return board;
  }
  return applyMove(board, position, piece, player).board;
};

/** Pick a random rock/paper/scissors piece the player still has. */
export const getRandomPiece = (inventory: PlayerInventory): PieceType | null => {
  const availablePieces: PieceType[] = [];

  if (inventory[PieceType.ROCK] > 0) availablePieces.push(PieceType.ROCK);
  if (inventory[PieceType.PAPER] > 0) availablePieces.push(PieceType.PAPER);
  if (inventory[PieceType.SCISSORS] > 0) availablePieces.push(PieceType.SCISSORS);

  if (availablePieces.length === 0) return null;

  return availablePieces[Math.floor(Math.random() * availablePieces.length)];
};
