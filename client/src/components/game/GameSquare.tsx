import React from 'react';
import { GamePiece } from './GamePiece';
import { Cell, Position, PieceType, Player } from '../../lib/types';
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

  // デバッグログを追加
  const ownerType = typeof cell.owner;
  const ownerValue = String(cell.owner);
  const ownerIsP1 = cell.owner === Player.PLAYER1 || ownerValue === 'PLAYER1';
  const ownerIsP2 = cell.owner === Player.PLAYER2 || ownerValue === 'PLAYER2';
  
  console.log(`Cell at ${position.row},${position.col}:`, { 
    piece: cell.piece, 
    owner: cell.owner, 
    ownerType,
    ownerValue,
    ownerIsP1,
    ownerIsP2,
    hasBeenUsed: cell.hasBeenUsed 
  });
  
  // Force a more robust background color selection - completely rewritten
  let bgColorClass = "";
  
  // 極めてシンプルな条件分岐で背景色を決定
  if (isValidMove) {
    // Valid move highlighting
    bgColorClass = "bg-green-300 cursor-pointer ring-2 ring-green-500 hover:bg-green-400";
  } 
  else if (cell.hasBeenUsed && cell.piece !== PieceType.EMPTY) {
    // Janken battle cell - amber
    bgColorClass = "bg-amber-300";
  }
  else if (cell.piece !== PieceType.EMPTY) {
    // Player-specific colors
    if (ownerValue.includes('PLAYER1')) {
      bgColorClass = "bg-blue-300"; // Player 1 - BLUE
    } 
    else if (ownerValue.includes('PLAYER2')) {
      bgColorClass = "bg-red-300";  // Player 2 - RED
    }
    else {
      console.warn("Unknown owner:", cell.owner);
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
