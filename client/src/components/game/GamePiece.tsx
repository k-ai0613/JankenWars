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
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  }[size];

  const containerSize = {
    sm: 'w-7 h-7',
    md: 'w-12 h-12',
    lg: 'w-14 h-14'
  }[size];
  
  // Determine owner color styles
  const ownerColor = owner === Player.PLAYER1 
    ? 'text-blue-600 bg-blue-200 border-blue-400' 
    : 'text-red-600 bg-red-200 border-red-400';
  
  // Determine label for piece type (Unicode characters for better visibility)
  const pieceLabel = {
    [PieceType.ROCK]: 'R',
    [PieceType.PAPER]: 'P',
    [PieceType.SCISSORS]: 'S',
    [PieceType.SPECIAL]: '★',
  }[type];
  
  // Label size based on container size
  const labelSize = {
    sm: 'w-4 h-4 text-[9px] -mt-1 -mr-1',
    md: 'w-6 h-6 text-xs -mt-2 -mr-2',
    lg: 'w-7 h-7 text-sm -mt-2 -mr-2'
  }[size];
  
  // Combine all classes
  const pieceClass = `${ownerColor} ${containerSize} ${fontSize} rounded-full border-2 shadow-md flex items-center justify-center relative`;

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
    <div className={`flex items-center justify-center ${selectedClass}`}>
      <div className={pieceClass}>
        {renderPieceIcon()}
        <div className={`absolute top-0 right-0 ${labelSize} bg-white text-black font-bold rounded-full flex items-center justify-center shadow-sm border border-gray-300`}>
          {pieceLabel}
        </div>
      </div>
    </div>
  );
};
