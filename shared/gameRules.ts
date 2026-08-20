// Authoritative game rules, shared by the client and the server.
//
// Every rule constant and every rule decision lives here. The server validates
// moves with the same code the client uses to preview them, so a modified
// client cannot make a move the real rules forbid.

import {
  Board,
  Cell,
  PieceType,
  Player,
  PlayerInventory,
  Position,
  WinningLine,
  isCombatPiece,
} from './gameTypes.js';

/** Board is BOARD_SIZE x BOARD_SIZE. */
export const BOARD_SIZE = 6;

/**
 * Pieces in a row needed to win, in any of the four directions.
 *
 * Changing this number changes the game. It is the only place the value is
 * written down — the UI copy in client/src/lib/stores/useLanguage.tsx reads
 * from WIN_LENGTH so the rules the player is shown cannot drift from the
 * rules the code enforces.
 */
export const WIN_LENGTH = 4;

/** Starting count for each of rock, paper and scissors. */
export const INITIAL_PIECE_COUNT = 7;

/** Starting count for the special (uncapturable) piece. */
export const INITIAL_SPECIAL_COUNT = 1;

export function createEmptyBoard(): Board {
  const board: Board = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    const cells: Cell[] = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      cells.push({ piece: PieceType.EMPTY, owner: Player.NONE, hasBeenUsed: false });
    }
    board.push(cells);
  }
  return board;
}

export function createInitialInventory(): PlayerInventory {
  return {
    [PieceType.ROCK]: INITIAL_PIECE_COUNT,
    [PieceType.PAPER]: INITIAL_PIECE_COUNT,
    [PieceType.SCISSORS]: INITIAL_PIECE_COUNT,
    [PieceType.SPECIAL]: INITIAL_SPECIAL_COUNT,
  };
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((cell) => ({ ...cell })));
}

export function isWithinBoard(position: Position): boolean {
  const { row, col } = position;
  return (
    Number.isInteger(row) &&
    Number.isInteger(col) &&
    row >= 0 &&
    row < BOARD_SIZE &&
    col >= 0 &&
    col < BOARD_SIZE
  );
}

/**
 * Janken outcome from the attacker's point of view.
 *
 * An identical piece counts as a loss for the attacker: the defender holds the
 * cell. Only rock/paper/scissors take part; anything else never wins.
 */
export function attackerWins(
  attackingPiece: PieceType | null,
  defendingPiece: PieceType | null,
): boolean {
  if (!isCombatPiece(attackingPiece) || !isCombatPiece(defendingPiece)) return false;
  return (
    (attackingPiece === PieceType.ROCK && defendingPiece === PieceType.SCISSORS) ||
    (attackingPiece === PieceType.SCISSORS && defendingPiece === PieceType.PAPER) ||
    (attackingPiece === PieceType.PAPER && defendingPiece === PieceType.ROCK)
  );
}

/**
 * Legacy shape of {@link attackerWins}: returns Player.PLAYER1 when the
 * attacker wins and Player.PLAYER2 when the defender does, regardless of which
 * real player is attacking. Kept because the AI and the stores read it.
 */
export function determineWinner(
  attackingPiece: PieceType | null,
  defendingPiece: PieceType | null,
): Player {
  if (!isCombatPiece(attackingPiece) || !isCombatPiece(defendingPiece)) return Player.NONE;
  return attackerWins(attackingPiece, defendingPiece) ? Player.PLAYER1 : Player.PLAYER2;
}

/**
 * Whether `player` may place `piece` at `position`.
 *
 * Capturing requires winning the janken battle. The server calls this before
 * applying any move, so a losing piece can never take a cell.
 */
export function isValidMove(
  board: Board,
  position: Position,
  piece: PieceType | null,
  player: Player,
): boolean {
  if (!isWithinBoard(position)) return false;
  if (piece === null || piece === PieceType.EMPTY) return false;
  if (player !== Player.PLAYER1 && player !== Player.PLAYER2) return false;

  const targetCell = board[position.row]?.[position.col];
  if (!targetCell) return false;

  // A cell locked by a previous janken battle is out of play for good.
  if (targetCell.hasBeenUsed) return false;

  // Any piece may be placed on an empty cell.
  if (targetCell.piece === PieceType.EMPTY) return true;

  // Beyond this point the move is a capture attempt.

  // The special piece only ever goes on an empty cell.
  if (piece === PieceType.SPECIAL) return false;

  // Own pieces cannot be taken.
  if (targetCell.owner === player) return false;

  // The special piece cannot be captured.
  if (targetCell.piece === PieceType.SPECIAL) return false;

  // The attacker must win the janken battle.
  return attackerWins(piece, targetCell.piece);
}

export interface AppliedMove {
  board: Board;
  /** The piece that was taken, or null when the cell was empty. */
  capturedPiece: PieceType | null;
  /** True when the cell is now locked by a janken battle. */
  locked: boolean;
}

/**
 * Apply a move that {@link isValidMove} has already approved.
 *
 * Returns a new board; the input is left untouched. Throws if the move is not
 * legal, so an unvalidated call fails loudly instead of corrupting the board.
 */
export function applyMove(
  board: Board,
  position: Position,
  piece: PieceType,
  player: Player,
): AppliedMove {
  if (!isValidMove(board, position, piece, player)) {
    throw new Error(
      `applyMove called with an illegal move: ${piece} at (${position.row}, ${position.col}) for ${player}`,
    );
  }

  const nextBoard = cloneBoard(board);
  const targetCell = nextBoard[position.row][position.col];
  const previousPiece = targetCell.piece;
  const wasCapture = previousPiece !== PieceType.EMPTY;

  targetCell.piece = piece;
  targetCell.owner = player;
  targetCell.hasBeenUsed = wasCapture;

  return {
    board: nextBoard,
    capturedPiece: wasCapture ? previousPiece : null,
    locked: wasCapture,
  };
}

const DIRECTIONS: ReadonlyArray<readonly [number, number]> = [
  [0, 1], // horizontal
  [1, 0], // vertical
  [1, 1], // diagonal, top-left to bottom-right
  [1, -1], // diagonal, top-right to bottom-left
];

export function findWinningLine(board: Board, player: Player): WinningLine | null {
  if (player !== Player.PLAYER1 && player !== Player.PLAYER2) return null;

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      for (const [dRow, dCol] of DIRECTIONS) {
        const endRow = row + dRow * (WIN_LENGTH - 1);
        const endCol = col + dCol * (WIN_LENGTH - 1);
        if (endRow < 0 || endRow >= BOARD_SIZE || endCol < 0 || endCol >= BOARD_SIZE) continue;

        const positions: Position[] = [];
        for (let i = 0; i < WIN_LENGTH; i++) {
          const r = row + dRow * i;
          const c = col + dCol * i;
          const cell = board[r][c];
          if (cell.owner !== player || cell.piece === PieceType.EMPTY) break;
          positions.push({ row: r, col: c });
        }

        if (positions.length === WIN_LENGTH) {
          return { positions, player };
        }
      }
    }
  }

  return null;
}

export function checkWin(board: Board, player: Player): boolean {
  return findWinningLine(board, player) !== null;
}

/**
 * A draw is a full board, or both players having run out of pieces.
 *
 * Call this with the inventories as they stand *after* the move has been
 * deducted, otherwise the last placement is counted twice.
 */
export function checkDraw(
  board: Board,
  player1Inventory: PlayerInventory,
  player2Inventory: PlayerInventory,
): boolean {
  const hasEmptyCell = board.some((row) => row.some((cell) => cell.piece === PieceType.EMPTY));
  if (!hasEmptyCell) return true;

  const player1HasPieces = Object.values(player1Inventory).some((count) => count > 0);
  const player2HasPieces = Object.values(player2Inventory).some((count) => count > 0);
  return !player1HasPieces && !player2HasPieces;
}
