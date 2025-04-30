import React, { useMemo, useEffect } from 'react';
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
  
  // デバッグ: ボードの状態を表示
  useEffect(() => {
    console.log('[GameBoard] board cells hasBeenUsed status:');
    
    // 各セルのhasBeenUsed状態を確認
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        if (board[i][j].hasBeenUsed) {
          console.log(`[GameBoard] Cell ${i},${j} hasBeenUsed=true`);
        }
      }
    }
  }, [board]);
  
  // 重要: 盤面のセルを毎回新しく処理
  const processedBoard = useMemo(() => {
    console.log('[GameBoard] Re-processing board...');
    
    // 新たに全てのセルを処理し直す
    const newBoard = [];
    for (let i = 0; i < board.length; i++) {
      const row = [];
      for (let j = 0; j < board[i].length; j++) {
        // 各セルの値を個別に新しいオブジェクトとして作成
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
              key={`cell-${rowIndex}-${colIndex}-${phase}`}
              cell={cell}
              position={{ row: rowIndex, col: colIndex }}
              isValidMove={!!validMoves[`${rowIndex}-${colIndex}`]}
              onClick={handleSquareClick}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default GameBoard;