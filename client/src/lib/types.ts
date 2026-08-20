// Client-side game types.
//
// The types themselves live in shared/gameTypes.ts, which the server uses too.
// Only client-specific helpers and view state are declared here.

export {
  PieceType,
  Player,
  GamePhase,
  GameResult,
  isCombatPiece,
  isPieceType,
  isPlayer,
} from '@shared/gameTypes';

export type {
  Position,
  Cell,
  Board,
  WinningLine,
  PlayerInventory,
  CombatPiece,
} from '@shared/gameTypes';

import { Player, PieceType } from '@shared/gameTypes';
import type { Board, GamePhase, GameResult, PlayerInventory, WinningLine } from '@shared/gameTypes';

/**
 * Coerce a value that should be a Player into the enum.
 *
 * Values arrive from the server, from persisted state and from older payload
 * shapes, so this stays tolerant. Unknown values become Player.NONE.
 */
export function normalizePlayer(player: Player | string | null | undefined): Player {
  if (player === Player.PLAYER1 || player === Player.PLAYER2 || player === Player.NONE) {
    return player;
  }

  if (player === undefined || player === null) {
    return Player.NONE;
  }

  const playerStr = String(player).toUpperCase();
  if (playerStr === 'PLAYER1') return Player.PLAYER1;
  if (playerStr === 'PLAYER2') return Player.PLAYER2;
  if (playerStr === 'NONE') return Player.NONE;

  // Tolerate wrapped forms such as "Player.PLAYER1".
  if (playerStr.includes('PLAYER1')) return Player.PLAYER1;
  if (playerStr.includes('PLAYER2')) return Player.PLAYER2;

  console.warn('[normalizePlayer] unrecognised player value:', player);
  return Player.NONE;
}

/** Lower-case player key used to build i18n message keys. */
export function playerMessageKey(player: Player | string | null | undefined): 'player1' | 'player2' | 'none' {
  const normalized = normalizePlayer(player);
  if (normalized === Player.PLAYER1) return 'player1';
  if (normalized === Player.PLAYER2) return 'player2';
  return 'none';
}

/** Local view state for a game in progress. */
export interface GameState {
  board: Board;
  currentPlayer: Player;
  phase: GamePhase;
  result: GameResult;
  selectedPiece: PieceType | null;
  player1Inventory: PlayerInventory;
  player2Inventory: PlayerInventory;
  message: string;
  winningLine: WinningLine | null;
}
