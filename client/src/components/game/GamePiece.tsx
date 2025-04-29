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

  // Determine size class
  const sizeClass = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  }[size];

  // Determine owner color and gradient
  const ownerClass = owner === Player.PLAYER1 
    ? 'text-blue-500 drop-shadow-[0_0_2px_rgba(59,130,246,0.5)]' 
    : 'text-red-500 drop-shadow-[0_0_2px_rgba(239,68,68,0.5)]';

  // Selected piece has a highlight
  const selectedClass = selected ? 'ring-2 ring-yellow-400' : '';

  // Render the appropriate icon based on piece type
  const renderPieceIcon = () => {
    switch (type) {
      case PieceType.ROCK:
        return <FaHandRock className={`${sizeClass} ${ownerClass}`} />;
      case PieceType.PAPER:
        return <FaHandPaper className={`${sizeClass} ${ownerClass}`} />;
      case PieceType.SCISSORS:
        return <FaHandScissors className={`${sizeClass} ${ownerClass}`} />;
      case PieceType.SPECIAL:
        return <FaStar className={`${sizeClass} ${ownerClass}`} />;
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
        {renderPieceIcon()}
      </motion.div>
    </AnimatePresence>
  );
};
