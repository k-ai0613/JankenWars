// Server-side game types.
//
// These live in shared/gameTypes.ts so the client and the server can never
// disagree about them again (see commit ddda9a2). This module only re-exports.

export {
  Player,
  PieceType,
  GamePhase,
  GameResult,
  isCombatPiece,
  isPieceType,
  isPlayer,
} from "../shared/gameTypes.js";

export type {
  Position,
  Cell,
  Board,
  WinningLine,
  PlayerInventory,
  CombatPiece,
} from "../shared/gameTypes.js";
