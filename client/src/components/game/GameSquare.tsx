import React from 'react';
import { GamePiece } from './GamePiece';
import { Cell, Position } from '../../lib/types';
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
      boxShadow: ['0px 0px 0px rgba(254, 240, 138, 0)', '0px 0px 20px rgba(254, 240, 138, 1)', '0px 0px 0px rgba(254, 240, 138, 0)'],
      transition: {
        duration: 0.7,
        times: [0, 0.5, 1],
        repeat: 0
      }
    }
  };

  return (
    <motion.div 
      className={cn(
        "w-full h-full border border-gray-300 flex items-center justify-center",
        "transition-colors duration-200 ease-in-out",
        isValidMove ? "bg-green-100 cursor-pointer hover:bg-green-200" : "bg-gray-50",
        cell.piece !== "EMPTY" && "bg-opacity-90"
      )}
      onClick={handleClick}
      data-testid={`cell-${position.row}-${position.col}`}
      variants={cellVariants}
      animate={isCapturing ? "capturing" : "idle"}
    >
      <GamePiece type={cell.piece} owner={cell.owner} />
    </motion.div>
  );
};

export default GameSquare;
