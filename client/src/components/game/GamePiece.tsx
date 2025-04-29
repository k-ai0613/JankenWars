import React from 'react';
import { PieceType, Player } from '../../lib/types';
import { FaHandRock, FaHandPaper, FaHandScissors, FaStar } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

interface GamePieceProps {
  type: PieceType;
  owner: Player;
  selected?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const GamePiece: React.FC<GamePieceProps> = ({
  type,
  owner,
  selected = false,
  size = 'md',
}) => {
  if (type === PieceType.EMPTY) {
    return null;
  }

  // Determine font size based on the size prop
  const fontSize = {
    sm: 'text-sm',
    md: 'text-xl',
    lg: 'text-2xl',
  }[size];

  const containerSize = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }[size];
  
  // Determine owner color styles
  const ownerColor = owner === Player.PLAYER1 
    ? 'text-blue-600 bg-blue-200 border-blue-400' 
    : 'text-red-600 bg-red-200 border-red-400';
  
  // Combine all classes
  const pieceClass = `${ownerColor} ${containerSize} ${fontSize} rounded-full border-2 shadow-md flex items-center justify-center`;

  // Selected piece has a highlight
  const selectedClass = selected ? 'ring-2 ring-yellow-400' : '';

  // Render the appropriate icon based on piece type
  const renderPieceIcon = () => {
    switch (type) {
      case PieceType.ROCK:
        return '✊';
      case PieceType.PAPER:
        return '✋';
      case PieceType.SCISSORS:
        return '✌️';
      case PieceType.SPECIAL:
        return '⭐';
      default:
        return null;
    }
  };

  // Animation variants
  const pieceVariants = {
    initial: { scale: 0, opacity: 0, rotate: -180 },
    animate: { scale: 1, opacity: 1, rotate: 0, transition: { duration: 0.5, type: 'spring', stiffness: 200 } },
    exit: { scale: 0, opacity: 0, rotate: 180, transition: { duration: 0.3 } },
    hover: { scale: 1.1, transition: { duration: 0.2 } },
    // More dramatic and satisfying capture animation
    captured: { 
      scale: [1, 1.3, 0], 
      opacity: [1, 1, 0], 
      rotate: [0, 45, 270], 
      filter: ["brightness(100%)", "brightness(150%)", "brightness(50%)"],
      transition: { duration: 0.7, ease: "easeOut" } 
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        className={`flex items-center justify-center ${selectedClass}`}
        initial="initial"
        animate="animate"
        exit="exit"
        whileHover="hover"
        layoutId={`piece-${type}-${owner}`}
        variants={pieceVariants}
      >
        <div className={pieceClass}>
          {renderPieceIcon()}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
