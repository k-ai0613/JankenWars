// Server-side game logic.
//
// The rules themselves live in shared/gameRules.ts and are the same code the
// client runs. Previously this file carried its own copy, which had drifted:
// it allowed a capture without resolving the janken battle, so any client
// could take a cell with a losing piece.

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
} from "../shared/gameRules.js";

export type { AppliedMove } from "../shared/gameRules.js";
