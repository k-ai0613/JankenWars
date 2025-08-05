import React from 'react';
import { GamePiece } from './GamePiece';
import { Cell, Position, PieceType, Player, normalizePlayer } from '../../lib/types';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnlineGame } from '../../lib/stores/useOnlineGame';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

interface OnlineGameSquareProps {
  cell: Cell;
  position: Position;
  isValidMove: boolean;
  isWinningCell?: boolean; // 勝利ラインのセルかどうかを示すフラグ
  onClick: (position: Position) => void;
}

const OnlineGameSquare: React.FC<OnlineGameSquareProps> = ({ 
  cell, 
  position, 
  isValidMove,
  isWinningCell = false, // デフォルト値はfalse
  onClick 
}) => {
  const { currentPlayer, gamePhase, localPlayerNumber, isSpectator } = useOnlineGame();
  
  // 自分のターンかどうかチェック
  const isMyTurn = !isSpectator && (
    (localPlayerNumber === 1 && currentPlayer === Player.PLAYER1) || 
    (localPlayerNumber === 2 && currentPlayer === Player.PLAYER2)
  );
  
  // 操作が無効な状態かどうか
  const isDisabled = !isMyTurn || gamePhase !== 'SELECTING_CELL';
  
  // Check if this square is being captured (アニメーション用)
  const [isCapturing, setIsCapturing] = React.useState(false);
  
  // アニメーションの前回の状態を保存して変化を検知
  const prevCell = React.useRef(cell);
  
  // セルの変化を検知してキャプチャアニメーション発火
  React.useEffect(() => {
    if (prevCell.current.piece !== cell.piece && cell.piece !== PieceType.EMPTY) {
      setIsCapturing(true);
      
      // アニメーション終了後にリセット
      const timer = setTimeout(() => {
        setIsCapturing(false);
      }, 800);
      
      return () => clearTimeout(timer);
    }
    
    prevCell.current = cell;
  }, [cell]);
  
  const handleClick = () => {
    // 無効状態の場合はクリック無効化
    if (isDisabled) {
      return;
    }
    onClick(position);
  };

  // Variants for the cell animation
  const cellVariants = {
    idle: {},
    capturing: {
      boxShadow: [
        '0px 0px 0px rgba(245, 158, 11, 0)', 
        '0px 0px 30px rgba(245, 158, 11, 0.8)', 
        '0px 0px 0px rgba(245, 158, 11, 0)'
      ],
      scale: [1, 1.1, 1],
      backgroundColor: [
        'rgba(255, 255, 255, 0)', 
        'rgba(245, 158, 11, 0.4)', 
        'rgba(255, 255, 255, 0)'
      ],
      rotateZ: [0, 2, -2, 0],
      transition: {
        duration: 0.8,
        times: [0, 0.3, 0.7, 1],
        ease: "easeInOut"
      }
    }
  };

  // 所有者の文字列表現を直接取得して使用
  const ownerAsString = String(cell.owner).toUpperCase();
  
  // 明示的な文字列比較で所有者を判定
  const isPlayer1 = ownerAsString === 'PLAYER1' || ownerAsString.includes('PLAYER1');
  const isPlayer2 = ownerAsString === 'PLAYER2' || ownerAsString.includes('PLAYER2');
  
  // 重要なセルの状態のみのデバッグログ
  if (cell.hasBeenUsed || isWinningCell) {
    console.log(`[OnlineGameSquare] Cell at ${position.row},${position.col} hasBeenUsed=${cell.hasBeenUsed}, isWinningCell=${isWinningCell}, piece=${cell.piece}, owner=${cell.owner}`);
  }
  
  // 完全に再実装された背景色選択ロジック
  let bgColorClass = "";
  let logReason = "";

  // 勝利ラインのセルの場合、特別なスタイルを適用
  if (isWinningCell) {
    if (isPlayer1) {
      bgColorClass = "bg-blue-500 ring-2 ring-yellow-300 animate-pulse";
      logReason = "WinningCell, Player1 (Blue)";
    } else if (isPlayer2) {
      bgColorClass = "bg-red-500 ring-2 ring-yellow-300 animate-pulse";
      logReason = "WinningCell, Player2 (Red)";
    } else {
      bgColorClass = "bg-amber-400 ring-2 ring-yellow-300 animate-pulse";
      logReason = "WinningCell, No Owner (Amber)";
    }
  }
  else if (cell.piece !== PieceType.EMPTY) {
    bgColorClass = "bg-emerald-500 ring-2 ring-emerald-700";
    logReason = `PiecePresent (${cell.piece}), ForcedEmerald (Ignoring isValidMove: ${isValidMove})`;
  } else if (isValidMove) {
    if (isDisabled) {
      bgColorClass = "bg-gray-300 cursor-not-allowed ring-1 ring-gray-400";
      logReason = "NoPiece, IsValidMove, Disabled (Yellow Attempt)";
    } else {
      bgColorClass = "bg-yellow-200 cursor-pointer ring-2 ring-yellow-500 hover:bg-yellow-300";
      logReason = "NoPiece, IsValidMove, Enabled (Yellow)";
    }
  } else if (cell.hasBeenUsed) {
    bgColorClass = "bg-emerald-500 ring-2 ring-emerald-700";
    logReason = "NoPiece, HasBeenUsed (Emerald)";
  }
  else {
    bgColorClass = isDisabled ? "bg-green-100 opacity-70" : "bg-green-200 hover:bg-green-300/70";
    logReason = "NoPiece, NotIsValidMove, NotHasBeenUsed (Empty Green)";
  }
  
  // 背景色決定のログ
  console.log(`[OnlineGameSquare] Pos: ${position.row},${position.col}, Piece: ${cell.piece}, Owner: ${cell.owner}, HasBeenUsed: ${cell.hasBeenUsed}, IsValidMove: ${isValidMove}, Disabled: ${isDisabled}, IsWinningCell: ${isWinningCell}, Reason: ${logReason}, BgColor: ${bgColorClass}`);
  
  return (
    <motion.div 
      className={cn(
        "w-full h-full min-w-[40px] min-h-[40px] md:min-w-[60px] md:min-h-[60px] flex items-center justify-center relative",
        "transition-colors duration-150 ease-in-out", // duration短縮
        "rounded-sm overflow-hidden shadow-inner", // rounded-smに変更
        bgColorClass,
        // (cell.piece !== PieceType.EMPTY) && "bg-opacity-90", // 不要かも
        "touch-manipulation" // タッチデバイス用の最適化
      )}
      onClick={handleClick}
      data-testid={`cell-${position.row}-${position.col}`}
      data-winning-cell={isWinningCell.toString()}
      variants={cellVariants}
      animate={isCapturing ? "capturing" : "idle"}
      whileHover={isValidMove && !isDisabled ? { scale: 1.03 } : {}}
      whileTap={isValidMove && !isDisabled ? { scale: 0.98 } : {}}
    >
      {/* Cell border effects - 不要かも */}
      {/* <div className="absolute inset-0 border border-green-400/30 opacity-50 rounded-sm pointer-events-none"></div> */}
      
      {/* Light reflection effect */}
      {/* <div className="absolute inset-0 bg-gradient-to-br from-white to-transparent opacity-10 pointer-events-none"></div> */}
      
      {/* Game piece */}
      {/* プレイヤーに応じた強調オーバーレイは削除 (背景色で表現)*/}
      {/* {isPlayer1 && cell.piece !== PieceType.EMPTY && (...)} */}
      {/* {isPlayer2 && cell.piece !== PieceType.EMPTY && (...)} */}
      
      <div className="relative z-10 flex items-center justify-center h-full w-full p-1 md:p-1">
        {cell.piece && cell.piece !== PieceType.EMPTY && (
          <GamePiece 
            type={cell.piece} 
            owner={cell.owner ? normalizePlayer(cell.owner) : Player.NONE} 
            size="auto" // スマホ対応のためにレスポンシブサイズを使用
          />
        )}
      </div>
    </motion.div>
  );
};

export default OnlineGameSquare; 