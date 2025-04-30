import React, { useMemo } from 'react';
import GameSquare from './GameSquare';
import { Board, Cell, GamePhase, Player, Position, PieceType } from '../../lib/types';
import { isValidMove } from '../../lib/gameUtils';

interface OnlineGameBoardProps {
  board: Board;
  onSquareClick: (row: number, col: number) => void;
  highlightedCells?: Position[];
  currentPlayer: Player;
}

export const GameBoard: React.FC<OnlineGameBoardProps> = ({ 
  board, 
  onSquareClick, 
  highlightedCells = [],
  currentPlayer 
}) => {
  // Process the board to include position property for each cell
  const processedBoard = useMemo(() => {
    // Create a new deep copy of the board
    const newBoard = [];
    for (let i = 0; i < board.length; i++) {
      const row = [];
      for (let j = 0; j < board[i].length; j++) {
        // Copy each cell as a new object with position added
        const originalCell = board[i][j];
        const cell = {
          piece: originalCell.piece,
          owner: originalCell.owner,
          hasBeenUsed: originalCell.hasBeenUsed,
          position: { row: i, col: j }
        };
        row.push(cell);
      }
      newBoard.push(row);
    }
    return newBoard;
  }, [board]);

  // Create a map of highlighted cells for quick lookup
  const highlightedCellMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    highlightedCells.forEach(pos => {
      map[`${pos.row}-${pos.col}`] = true;
    });
    return map;
  }, [highlightedCells]);

  // Handle square click
  const handleSquareClick = (position: Position) => {
    onSquareClick(position.row, position.col);
  };

  return (
    <div className="relative">
      {/* Board outline and shadow effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-700 to-amber-900 rounded-xl transform rotate-1 scale-105 -z-10 opacity-60 blur-sm"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-amber-700 to-amber-900 rounded-xl transform -rotate-1 scale-105 -z-10 opacity-40 blur-md"></div>
      
      {/* Main board */}
      <div className="w-full max-w-2xl mx-auto aspect-[6/5.8] grid grid-cols-6 gap-1 bg-gradient-to-br from-amber-100 to-amber-200 p-3 rounded-xl shadow-lg border-4 border-amber-300 relative z-10">
        {/* Board texture overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGZpbGw9InJnYmEoMjM2LCAxOTMsIDEzMiwgMC4xKSIgZD0iTTAgMGg0MHY0MEgwVjB6Ii8+PHBhdGggZD0iTTAgMGg0MHY0MEgwVjB6IiBzdHJva2U9InJnYmEoMjM2LCAxOTMsIDEzMiwgMC4yKSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48cGF0aCBkPSJNMCAwaDEwdjEwSDBWMHoiIHN0cm9rZT0icmdiYSgyMzYsIDE5MywgMTMyLCAwLjIpIiBzdHJva2Utd2lkdGg9IjAuNSIvPjxwYXRoIGQ9Ik0xMCAwaDEwdjEwSDEwVjB6IiBzdHJva2U9InJnYmEoMjM2LCAxOTMsIDEzMiwgMC4yKSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48cGF0aCBkPSJNMjAgMGgxMHYxMEgyMFYweiIgc3Ryb2tlPSJyZ2JhKDIzNiwgMTkzLCAxMzIsIDAuMikiIHN0cm9rZS13aWR0aD0iMC41Ii8+PHBhdGggZD0iTTMwIDBoMTB2MTBIMzBWMHoiIHN0cm9rZT0icmdiYSgyMzYsIDE5MywgMTMyLCAwLjIpIiBzdHJva2Utd2lkdGg9IjAuNSIvPjxwYXRoIGQ9Ik0wIDEwaDEwdjEwSDBWMTB6IiBzdHJva2U9InJnYmEoMjM2LCAxOTMsIDEzMiwgMC4yKSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48cGF0aCBkPSJNMTAgMTBoMTB2MTBIMTBWMTB6IiBzdHJva2U9InJnYmEoMjM2LCAxOTMsIDEzMiwgMC4yKSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48cGF0aCBkPSJNMjAgMTBoMTB2MTBIMjBWMTB6IiBzdHJva2U9InJnYmEoMjM2LCAxOTMsIDEzMiwgMC4yKSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48cGF0aCBkPSJNMzAgMTBoMTB2MTBIMzBWMTB6IiBzdHJva2U9InJnYmEoMjM2LCAxOTMsIDEzMiwgMC4yKSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48cGF0aCBkPSJNMCAyMGgxMHYxMEgwVjIweiIgc3Ryb2tlPSJyZ2JhKDIzNiwgMTkzLCAxMzIsIDAuMikiIHN0cm9rZS13aWR0aD0iMC41Ii8+PHBhdGggZD0iTTEwIDIwaDEwdjEwSDEwVjIweiIgc3Ryb2tlPSJyZ2JhKDIzNiwgMTkzLCAxMzIsIDAuMikiIHN0cm9rZS13aWR0aD0iMC41Ii8+PHBhdGggZD0iTTIwIDIwaDEwdjEwSDIwVjIweiIgc3Ryb2tlPSJyZ2JhKDIzNiwgMTkzLCAxMzIsIDAuMikiIHN0cm9rZS13aWR0aD0iMC41Ii8+PHBhdGggZD0iTTMwIDIwaDEwdjEwSDMwVjIweiIgc3Ryb2tlPSJyZ2JhKDIzNiwgMTkzLCAxMzIsIDAuMikiIHN0cm9rZS13aWR0aD0iMC41Ii8+PHBhdGggZD0iTTAgMzBoMTB2MTBIMFYzMHoiIHN0cm9rZT0icmdiYSgyMzYsIDE5MywgMTMyLCAwLjIpIiBzdHJva2Utd2lkdGg9IjAuNSIvPjxwYXRoIGQ9Ik0xMCAzMGgxMHYxMEgxMFYzMHoiIHN0cm9rZT0icmdiYSgyMzYsIDE5MywgMTMyLCAwLjIpIiBzdHJva2Utd2lkdGg9IjAuNSIvPjxwYXRoIGQ9Ik0yMCAzMGgxMHYxMEgyMFYzMHoiIHN0cm9rZT0icmdiYSgyMzYsIDE5MywgMTMyLCAwLjIpIiBzdHJva2Utd2lkdGg9IjAuNSIvPjxwYXRoIGQ9Ik0zMCAzMGgxMHYxMEgzMFYzMHoiIHN0cm9rZT0icmdiYSgyMzYsIDE5MywgMTMyLCAwLjIpIiBzdHJva2Utd2lkdGg9IjAuNSIvPjwvZz48L3N2Zz4=')] opacity-40 rounded-lg pointer-events-none"></div>
        
        {processedBoard.map((row, rowIndex) => 
          row.map((cell, colIndex) => (
            <GameSquare
              key={`cell-${rowIndex}-${colIndex}`}
              cell={cell}
              position={{ row: rowIndex, col: colIndex }}
              isValidMove={!!highlightedCellMap[`${rowIndex}-${colIndex}`]}
              onClick={handleSquareClick}
            />
          ))
        )}
      </div>
    </div>
  );
};