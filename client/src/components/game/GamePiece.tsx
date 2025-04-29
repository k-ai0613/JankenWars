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
  
  // Determine owner color styles - using stronger background colors for better visibility
  const ownerColor = owner === Player.PLAYER1 
    ? 'text-blue-700 bg-blue-200 border-blue-400' 
    : 'text-red-700 bg-red-200 border-red-400';
  
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
  
  // Combine all classes - using background color based on player
  const pieceClass = `${ownerColor} ${containerSize} ${fontSize} rounded-full border shadow-sm flex items-center justify-center relative`;

  // Selected piece has a highlight
  const selectedClass = selected ? 'ring-2 ring-yellow-400' : '';

  // Render the appropriate icon based on piece type
  // In Japanese Janken Rules:
  // - Rock (グー) beats Scissors (チョキ)
  // - Scissors (チョキ) beats Paper (パー)
  // - Paper (パー) beats Rock (グー)
  const renderPieceIcon = () => {
    switch (type) {
      case PieceType.ROCK: // グー (Rock, 拳を握った形) - Beats Scissors
        return '✊';
      case PieceType.PAPER: // パー (Paper, 手のひらを広げた形) - Beats Rock
        return '✋';
      case PieceType.SCISSORS: // チョキ (Scissors, 人差し指と中指を出した形) - Beats Paper
        return '✌️';
      case PieceType.SPECIAL: // 特殊駒 (Special, 星マーク) - Can't attack or be attacked
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
