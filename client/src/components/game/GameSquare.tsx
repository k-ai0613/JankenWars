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

  return (
    <motion.div 
      className={cn(
        "w-full h-full min-w-[60px] min-h-[60px] flex items-center justify-center relative",
        "transition-colors duration-200 ease-in-out",
        "rounded-md overflow-hidden shadow-inner",
        isValidMove 
          ? "bg-gradient-to-br from-green-100 to-green-200 cursor-pointer ring-2 ring-green-300 hover:from-green-200 hover:to-green-300" 
          : cell.piece !== PieceType.EMPTY 
            ? cell.owner === Player.PLAYER1 
              ? "bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200" 
              : "bg-gradient-to-br from-red-50 to-red-100 border border-red-200"
            : "bg-gradient-to-br from-amber-50 to-amber-100",
        cell.piece !== PieceType.EMPTY && "bg-opacity-90"
      )}
      onClick={handleClick}
      data-testid={`cell-${position.row}-${position.col}`}
      variants={cellVariants}
      animate={isCapturing ? "capturing" : "idle"}
      whileHover={isValidMove ? { scale: 1.03 } : {}}
      whileTap={isValidMove ? { scale: 0.98 } : {}}
    >
      {/* Cell border effects */}
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
