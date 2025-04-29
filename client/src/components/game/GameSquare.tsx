import React from 'react';
import { GamePiece } from './GamePiece';
import { Cell, Position, PieceType, Player, normalizePlayer } from '../../lib/types';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';
import { useJankenGame } from '../../lib/stores/useJankenGame';

interface GameSquareProps {
  cell: Cell;
  position: Position;
  isValidMove: boolean;
  onClick: (position: Position) => void;
}

const GameSquare: React.FC<GameSquareProps> = ({ 
  cell, 
  position, 
  isValidMove,
  onClick 
}) => {
  const { captureAnimation, clearCaptureAnimation } = useJankenGame();
  
  // Check if this square is being captured
  const isCapturing = captureAnimation?.row === position.row && 
                      captureAnimation?.col === position.col;
  
  // Clear the capture animation after it finishes
  React.useEffect(() => {
    if (isCapturing) {
      const timer = setTimeout(() => {
        clearCaptureAnimation();
      }, 800); // Slightly longer than the animation duration
      
      return () => clearTimeout(timer);
    }
  }, [isCapturing, clearCaptureAnimation]);
  
  const handleClick = () => {
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
  
  console.log(`Cell at ${position.row},${position.col} DIRECT CHECK:`, { 
    piece: cell.piece, 
    owner: cell.owner, 
    ownerAsString,
    isPlayer1,
    isPlayer2,
    hasBeenUsed: cell.hasBeenUsed 
  });
  
  // 完全に再実装された背景色選択ロジック
  let bgColorClass = "";
  
  // 極めて明確な条件分岐で背景色を決定
  if (isValidMove) {
    // Valid move highlighting
    bgColorClass = "bg-green-300 cursor-pointer ring-2 ring-green-500 hover:bg-green-400";
  } 
  else if (cell.hasBeenUsed && cell.piece !== PieceType.EMPTY) {
    // Janken battle cell - amber
    bgColorClass = "bg-amber-300";
  }
  else if (cell.piece !== PieceType.EMPTY) {
    // 文字列ベースの単純な比較で背景色を選択
    if (isPlayer1) {
      bgColorClass = "bg-blue-300"; // Player 1 - BLUE
      console.log(`Cell ${position.row},${position.col} - BLUE for P1 ${cell.piece}`);
    } 
    else if (isPlayer2) {
      bgColorClass = "bg-red-300";  // Player 2 - RED
      console.log(`Cell ${position.row},${position.col} - RED for P2 ${cell.piece} using string check`);
    }
    else {
      console.warn("Unknown owner string:", { ownerOriginal: cell.owner, ownerAsString });
      bgColorClass = "bg-purple-300"; // Error indicator
    }
  } 
  else {
    // Empty cell
    bgColorClass = "bg-green-50";
  }
  
  return (
    <motion.div 
      className={cn(
        "w-full h-full min-w-[60px] min-h-[60px] flex items-center justify-center relative",
        "transition-colors duration-200 ease-in-out",
        "rounded-md overflow-hidden shadow-inner",
        bgColorClass,
        (cell.piece !== PieceType.EMPTY) && "bg-opacity-90"
      )}
      onClick={handleClick}
      data-testid={`cell-${position.row}-${position.col}`}
      variants={cellVariants}
      animate={isCapturing ? "capturing" : "idle"}
      whileHover={isValidMove ? { scale: 1.03 } : {}}
      whileTap={isValidMove ? { scale: 0.98 } : {}}
    >
      {/* Cell border effects - consistent across all cells */}
      <div className="absolute inset-0 border-2 border-amber-200 opacity-40 rounded-sm pointer-events-none"></div>
      
      {/* Light reflection effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white to-transparent opacity-10 pointer-events-none"></div>
      
      {/* Game piece */}
      <div className="relative z-10 flex items-center justify-center h-full w-full p-2">
        {cell.piece !== PieceType.EMPTY && (
          <GamePiece type={cell.piece} owner={cell.owner} size="lg" />
        )}
      </div>
    </motion.div>
  );
};

export default GameSquare;
