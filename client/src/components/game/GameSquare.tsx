import React from 'react';
import { GamePiece } from './GamePiece';
import { Cell, Position } from '../../lib/types';
import { cn } from '../../lib/utils';

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
  const handleClick = () => {
    onClick(position);
  };

  return (
    <div 
      className={cn(
        "w-full h-full border border-gray-300 flex items-center justify-center",
        "transition-colors duration-200 ease-in-out",
        isValidMove ? "bg-green-100 cursor-pointer hover:bg-green-200" : "bg-gray-50",
        cell.piece !== "EMPTY" && "bg-opacity-90"
      )}
      onClick={handleClick}
      data-testid={`cell-${position.row}-${position.col}`}
    >
      <GamePiece type={cell.piece} owner={cell.owner} />
    </div>
  );
};

export default GameSquare;
