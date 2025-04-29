import React from 'react';
import { PieceType, Player } from '../../lib/types';
import { FaHandRock, FaHandPaper, FaHandScissors, FaStar } from 'react-icons/fa';

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

  // Determine owner color
  const ownerClass = owner === Player.PLAYER1 
    ? 'text-blue-500' 
    : 'text-red-500';

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

  return (
    <div className={`flex items-center justify-center ${selectedClass}`}>
      {renderPieceIcon()}
    </div>
  );
};
