import React, { useMemo, useEffect } from 'react';
import OnlineGameSquare from './OnlineGameSquare';
import { useOnlineGame } from '../../lib/stores/useOnlineGame';
import { GamePhase, Player, Position, Cell } from '../../lib/types';
import { isValidMove } from '../../lib/gameUtils';
import { PieceType } from '../../lib/types';

interface ProcessedCell extends Cell {
  position: Position;
}

const OnlineGameBoard: React.FC = () => {
  // Extract all needed state from the store
  const { 
    board, 
    currentPlayer, 
    gamePhase: phase, 
    aiSelectedPiece,
    selectedPiece,
    makeMove,
    localPlayerNumber,
    isSpectator,
    winningLine
  } = useOnlineGame();
  
  // デバッグ: ボードの状態を表示
  useEffect(() => {
    console.log('[OnlineGameBoard] board cells hasBeenUsed status:');
    
    // 各セルのhasBeenUsed状態を確認
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[i].length; j++) {
        if (board[i][j].hasBeenUsed) {
          console.log(`[OnlineGameBoard] Cell ${i},${j} hasBeenUsed=true`);
        }
      }
    }

    // 勝利ラインの状態を確認
    if (winningLine) {
      console.log('[OnlineGameBoard] Winning line detected:', winningLine);
    }
  }, [board, winningLine]);
  
  // 重要: 盤面のセルを毎回新しく処理
  const processedBoard = useMemo(() => {
    console.log('[OnlineGameBoard] Re-processing board...');
    
    // 新たに全てのセルを処理し直す
    const newBoard: ProcessedCell[][] = [];
    for (let i = 0; i < board.length; i++) {
      const row: ProcessedCell[] = [];
      for (let j = 0; j < board[i].length; j++) {
        // 各セルの値を個別に新しいオブジェクトとして作成
        const originalCell = board[i][j];
        const cell: ProcessedCell = {
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

  // 勝利ラインに含まれるマスのマップを作成（メモ化）
  const winningCells = useMemo(() => {
    const cellMap: Record<string, boolean> = {};
    
    if (winningLine && winningLine.positions) {
      winningLine.positions.forEach(pos => {
        const key = `${pos.row}-${pos.col}`;
        cellMap[key] = true;
      });
      
      console.log('[OnlineGameBoard] Winning cells map created:', cellMap);
    }
    
    return cellMap;
  }, [winningLine]);

  // Generate the valid moves for the current selected piece (AIが選択した駒を使用)
  const validMoves = useMemo(() => {
    // ★ 配置する駒を決定 (特殊駒優先)
    const pieceForValidation = selectedPiece === PieceType.SPECIAL ? PieceType.SPECIAL : aiSelectedPiece;
    
    // ★ pieceForValidation を使うように修正
    if (phase !== GamePhase.SELECTING_CELL || !pieceForValidation) {
      return {};
    }

    // 自分のターンでない場合や観戦者の場合は有効な移動先を表示しない
    const isMyTurn = localPlayerNumber === 1 && currentPlayer === Player.PLAYER1 || 
                     localPlayerNumber === 2 && currentPlayer === Player.PLAYER2;

    if (isSpectator || !isMyTurn) {
      return {};
    }

    // Check all possible positions for valid moves
    const moves: Record<string, boolean> = {};
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 6; col++) {
        const position: Position = { row, col };
        // ★ pieceForValidation を使うように修正
        const valid = isValidMove(board, position, pieceForValidation, currentPlayer);
        if (valid) {
          moves[`${row}-${col}`] = true;
        }
      }
    }
    return moves;
  }, [board, currentPlayer, phase, aiSelectedPiece, selectedPiece, localPlayerNumber, isSpectator]);

  // Handler for square click
  const handleSquareClick = (position: Position) => {
    const isMyTurn = localPlayerNumber === 1 && currentPlayer === Player.PLAYER1 || 
                     localPlayerNumber === 2 && currentPlayer === Player.PLAYER2;
    const pieceToMove = selectedPiece === PieceType.SPECIAL ? PieceType.SPECIAL : aiSelectedPiece;

    if (phase === GamePhase.SELECTING_CELL && isMyTurn && !isSpectator && pieceToMove) {
      makeMove(position);
    }
  };

  return (
    <div className="relative touch-manipulation">
      {/* Board outline and shadow effects - ローカルに合わせたスタイル */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl transform rotate-1 scale-105 -z-10 opacity-60 blur-sm"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500 to-orange-500 rounded-xl transform -rotate-1 scale-105 -z-10 opacity-40 blur-md"></div>
      
      {/* Main board - ローカルに合わせたスタイル */}
      <div className="w-full max-w-2xl mx-auto aspect-[1/1] md:aspect-[1/1] grid grid-cols-6 gap-1 bg-gradient-to-br from-green-300 to-emerald-400 p-2 md:p-3 rounded-xl shadow-lg border-4 border-yellow-400 relative z-10">
        {/* Grid lines (optional, similar to local) */}
        {[...Array(5)].map((_, i) => (
          <div key={`v-line-${i}`} className="absolute top-0 bottom-0 left-[calc(16.666%*${i+1})] w-px bg-green-500/30" />
        ))}
        {[...Array(5)].map((_, i) => (
          <div key={`h-line-${i}`} className="absolute left-0 right-0 top-[calc(16.666%*${i+1})] h-px bg-green-500/30" />
        ))}
        
        {processedBoard.map((row, rowIndex) => 
          row.map((cell, colIndex) => {
            const cellKey = `${rowIndex}-${colIndex}`;
            const isWinningCell = winningCells[cellKey] || false;
            
            return (
              <OnlineGameSquare
                key={`cell-${rowIndex}-${colIndex}-${phase}`}
                cell={cell}
                position={{ row: rowIndex, col: colIndex }}
                isValidMove={!!validMoves[cellKey]}
                isWinningCell={isWinningCell}
                onClick={handleSquareClick}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export const GameBoard = OnlineGameBoard;
export default OnlineGameBoard;