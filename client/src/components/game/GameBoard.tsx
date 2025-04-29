import React, { useMemo } from 'react';
import GameSquare from './GameSquare';
import { useJankenGame } from '../../lib/stores/useJankenGame';
import { GamePhase, Player, Position } from '../../lib/types';
import { isValidMove } from '../../lib/gameUtils';

const GameBoard: React.FC = () => {
  const { 
    board, 
    currentPlayer, 
    phase, 
    selectedPiece,
    selectCell
  } = useJankenGame();

  // Generate the valid moves for the current selected piece
  const validMoves = useMemo(() => {
    if (phase !== GamePhase.SELECTING_CELL || !selectedPiece) {
      return {};
    }

    // Check all possible positions for valid moves
    const moves: Record<string, boolean> = {};
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 6; col++) {
        const position: Position = { row, col };
        const valid = isValidMove(board, position, selectedPiece, currentPlayer);
        if (valid) {
          moves[`${row}-${col}`] = true;
        }
      }
    }
    return moves;
  }, [board, currentPlayer, phase, selectedPiece]);

  // Handler for square click
  const handleSquareClick = (position: Position) => {
    if (phase === GamePhase.SELECTING_CELL) {
      selectCell(position);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto aspect-square grid grid-cols-6 gap-1 bg-gray-200 p-1 rounded-md shadow-md">
      {board.map((row, rowIndex) => 
        row.map((cell, colIndex) => (
          <GameSquare
            key={`${rowIndex}-${colIndex}`}
            cell={cell}
            position={{ row: rowIndex, col: colIndex }}
            isValidMove={!!validMoves[`${rowIndex}-${colIndex}`]}
            onClick={handleSquareClick}
          />
        ))
      )}
    </div>
  );
};

export default GameBoard;
