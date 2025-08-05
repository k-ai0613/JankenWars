import React, { useEffect, useState, useMemo, useCallback } from 'react';
import GameSquare from './GameSquare';
import { useJankenGame } from '../../lib/stores/useJankenGame';
import { GamePhase, Player, Position, PieceType, Cell } from '../../lib/types';
import { isValidMove } from '../../lib/gameUtils';
import { soundService } from '../../lib/soundService';

// 仮の盤面のセルの型 (実際には PieceType か null、あるいはもっと複雑なオブジェクト)
// interface CellData {
//   piece: PieceType | null;
// }

export function GameBoard() {
  const {
    board,
    currentPlayer,
    phase,
    selectedPiece,
    isAIEnabled,
    isAIThinking,
    placePiece,
    winningLine
  } = useJankenGame();
  
  // モバイル画面サイズ用の状態
  const [isMobile, setIsMobile] = useState(false);
  
  // 画面サイズの変更を検知
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // 安定化されたボードデータの準備
  const stableBoard = useMemo(() => {
    if (!board || !Array.isArray(board)) return null;
    
    // 完全に安定したボードデータを生成
    return board.map((row, rowIndex) => 
      row.map((cell, colIndex) => ({
        ...cell,
        position: { row: rowIndex, col: colIndex }
      }))
    );
  }, [board]);
  
  // 有効な移動先の計算（メモ化）
  const validMoves = useMemo(() => {
    if (phase !== GamePhase.SELECTING_CELL || !stableBoard) {
      return {};
    }

    console.log('[GameBoard] Calculating valid moves for:', {
      selectedPiece,
      currentPlayer,
      phase
    });

    const moves: Record<string, boolean> = {};
    
    for (let row = 0; row < stableBoard.length; row++) {
      for (let col = 0; col < stableBoard[row].length; col++) {
        const position: Position = { row, col };
        
        if (selectedPiece) {
          const valid = isValidMove(board as Cell[][], position, selectedPiece, currentPlayer);
          if (valid) {
            moves[`${row}-${col}`] = true;
          }
        } else {
          // 駒が選択されていない場合は空のセルのみ表示
          if (stableBoard[row][col].piece === PieceType.EMPTY) {
            moves[`${row}-${col}`] = true;
          }
        }
      }
    }
    
    console.log(`[GameBoard] Found ${Object.keys(moves).length} valid positions`);
    return moves;
  }, [stableBoard, currentPlayer, phase, selectedPiece, board]);

  // 勝利ラインに含まれるマスのマップを作成（メモ化）
  const winningCells = useMemo(() => {
    const cellMap: Record<string, boolean> = {};
    
    if (winningLine && winningLine.positions) {
      winningLine.positions.forEach(pos => {
        const key = `${pos.row}-${pos.col}`;
        cellMap[key] = true;
      });
    }
    
    return cellMap;
  }, [winningLine]);

  // クリックハンドラーの安定化
  const handleSquareClick = useCallback((position: Position) => {
    try {
      console.log('[GameBoard] Square clicked:', position, 'Phase:', phase, 'Selected piece:', selectedPiece);
      
      // AI思考中は操作を無効化
      if (isAIThinking) {
        console.log('[GameBoard] AI is thinking, please wait...');
        return;
      }
      
      // AIのターンかどうかのチェック
      const isAITurn = isAIEnabled && currentPlayer === Player.PLAYER2;
      if (isAITurn) {
        console.log('[GameBoard] It is AI turn, human interaction disabled');
        return;
      }
      
      // フェーズと駒の選択状態をチェック
      if (phase !== GamePhase.SELECTING_CELL) {
        console.log('[GameBoard] Click ignored. Wrong phase:', phase);
        return;
      }
      
      if (selectedPiece === null) {
        console.log('[GameBoard] Click ignored. No piece selected');
        return;
      }
      
      // 有効な移動先かどうかを確認
      const moveKey = `${position.row}-${position.col}`;
      const isValid = validMoves[moveKey] || false;
      
      if (!isValid) {
        console.log(`[GameBoard] Invalid move. Cannot place piece ${selectedPiece} at (${position.row}, ${position.col})`);
        soundService.play('hit');
        return;
      }
      
      console.log(`[GameBoard] Valid move. Placing piece ${selectedPiece} at (${position.row}, ${position.col})`);
      
      // 駒配置を実行
      placePiece(position.row, position.col);
      
    } catch (error) {
      console.error('[GameBoard] Error in handleSquareClick:', error);
      soundService.play('hit');
    }
  }, [phase, selectedPiece, isAIThinking, isAIEnabled, currentPlayer, validMoves, placePiece]);

  // ローディング状態の処理
  if (!stableBoard) {
    return (
      <div className="text-center p-4">
        <div className="animate-pulse">Loading board...</div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* AIが思考中の場合のオーバーレイ */}
      {isAIThinking && (
        <div className="absolute inset-0 bg-black bg-opacity-30 z-20 flex items-center justify-center rounded-xl">
          <div className="bg-white p-4 rounded-lg shadow-lg flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
            <p className="text-gray-800 font-medium">AIが考え中...</p>
          </div>
        </div>
      )}
      
      {/* Board outline and shadow effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-700 to-amber-900 rounded transform rotate-0.5 scale-101 -z-10 opacity-50 blur-sm"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-amber-700 to-amber-900 rounded transform -rotate-0.5 scale-101 -z-10 opacity-30 blur-md"></div>
      
      {/* Main board */}
      <div className={`w-full mx-auto aspect-[6/5.8] grid grid-cols-6 ${isMobile ? 'gap-0.5 p-0.5' : 'gap-0.5 p-1'} bg-gradient-to-br from-amber-100 to-amber-200 rounded shadow-sm border border-amber-300 relative z-10`}>
        {/* Board texture overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGZpbGw9InJnYmEoMjM2LCAxOTMsIDEzMiwgMC4xKSIgZD0iTTAgMGg0MHY0MEgwVjB6Ii8+PHBhdGggZD0iTTAgMGg0MHY0MEgwVjB6IiBzdHJva2U9InJnYmEoMjM2LCAxOTMsIDEzMiwgMC4yKSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48cGF0aCBkPSJNMCAwaDEwdjEwSDBWMHoiIHN0cm9rZT0icmdiYSgyMzYsIDE5MywgMTMyLCAwLjIpIiBzdHJva2Utd2lkdGg9IjAuNSIvPjxwYXRoIGQ9Ik0xMCAwaDEwdjEwSDEwVjB6IiBzdHJva2U9InJnYmEoMjM2LCAxOTMsIDEzMiwgMC4yKSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48cGF0aCBkPSJNMjAgMGgxMHYxMEgyMFYweiIgc3Ryb2tlPSJyZ2JhKDIzNiwgMTkzLCAxMzIsIDAuMikiIHN0cm9rZS13aWR0aD0iMC41Ii8+PHBhdGggZD0iTTMwIDBoMTB2MTBIMzBWMHoiIHN0cm9rZT0icmdiYSgyMzYsIDE5MywgMTMyLCAwLjIpIiBzdHJva2Utd2lkdGg9IjAuNSIvPjxwYXRoIGQ9Ik0wIDEwaDEwdjEwSDBWMTB6IiBzdHJva2U9InJnYmEoMjM2LCAxOTMsIDEzMiwgMC4yKSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48cGF0aCBkPSJNMTAgMTBoMTB2MTBIMTBWMTB6IiBzdHJva2U9InJnYmEoMjM2LCAxOTMsIDEzMiwgMC4yKSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48cGF0aCBkPSJNMjAgMTBoMTB2MTBIMjBWMTB6IiBzdHJva2U9InJnYmEoMjM2LCAxOTMsIDEzMiwgMC4yKSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48cGF0aCBkPSJNMzAgMTBoMTB2MTBIMzBWMTB6IiBzdHJva2U9InJnYmEoMjM2LCAxOTMsIDEzMiwgMC4yKSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48cGF0aCBkPSJNMCAyMGgxMHYxMEgwVjIweiIgc3Ryb2tlPSJyZ2JhKDIzNiwgMTkzLCAxMzIsIDAuMikiIHN0cm9rZS13aWR0aD0iMC41Ii8+PHBhdGggZD0iTTEwIDIwaDEwdjEwSDEwVjIweiIgc3Ryb2tlPSJyZ2JhKDIzNiwgMTkzLCAxMzIsIDAuMikiIHN0cm9rZS13aWR0aD0iMC41Ii8+PHBhdGggZD0iTTIwIDIwaDEwdjEwSDIwVjIweiIgc3Ryb2tlPSJyZ2JhKDIzNiwgMTkzLCAxMzIsIDAuMikiIHN0cm9rZS13aWR0aD0iMC41Ii8+PHBhdGggZD0iTTMwIDIwaDEwdjEwSDMwVjIweiIgc3Ryb2tlPSJyZ2JhKDIzNiwgMTkzLCAxMzIsIDAuMikiIHN0cm9rZS13aWR0aD0iMC41Ii8+PHBhdGggZD0iTTAgMzBoMTB2MTBIMFYzMHoiIHN0cm9rZT0icmdiYSgyMzYsIDE5MywgMTMyLCAwLjIpIiBzdHJva2Utd2lkdGg9IjAuNSIvPjxwYXRoIGQ9Ik0xMCAzMGgxMHYxMEgxMFYzMHoiIHN0cm9rZT0icmdiYSgyMzYsIDE5MywgMTMyLCAwLjIpIiBzdHJva2Utd2lkdGg9IjAuNSIvPjxwYXRoIGQ9Ik0yMCAzMGgxMHYxMEgyMFYzMHoiIHN0cm9rZT0icmdiYSgyMzYsIDE5MywgMTMyLCAwLjIpIiBzdHJva2Utd2lkdGg9IjAuNSIvPjxwYXRoIGQ9Ik0zMCAzMGgxMHYxMEgzMFYzMHoiIHN0cm9rZT0icmdiYSgyMzYsIDE5MywgMTMyLCAwLjIpIiBzdHJva2Utd2lkdGg9IjAuNSIvPjwvZz48L3N2Zz4=')] opacity-40 rounded pointer-events-none"></div>
        
        {/* ボードの安定したレンダリング - 完全に位置ベースのキー */}
        {stableBoard.map((row, rowIndex) => 
          row.map((cellData, colIndex) => {
            // 完全に位置に基づく安定したキー（状態に依存しない）
            const stableKey = `board-cell-${rowIndex}-${colIndex}`;
            const moveKey = `${rowIndex}-${colIndex}`;
            const isValid = validMoves[moveKey] || false;
            const isWinningCell = winningCells[moveKey] || false;
            
            // セルデータを完全に正規化
            const normalizedCell: Cell = {
              piece: cellData.piece ?? PieceType.EMPTY,
              owner: cellData.owner ?? Player.NONE,
              hasBeenUsed: cellData.hasBeenUsed ?? false
            };
            
            // 位置情報を安定化
            const stablePosition: Position = {
              row: rowIndex,
              col: colIndex
            };
            
            return (
              <GameSquare
                key={stableKey}
                cell={normalizedCell}
                position={stablePosition}
                isValidMove={isValid}
                isWinningCell={isWinningCell}
                onClick={handleSquareClick}
                isMobile={isMobile}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

export default GameBoard;