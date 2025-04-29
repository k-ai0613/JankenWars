import React from 'react';
import { GamePiece } from './GamePiece';
import { PieceType, Player, PlayerInventory } from '../../lib/types';
import { cn } from '../../lib/utils';

interface PlayerInfoProps {
  player: Player;
  inventory: PlayerInventory;
  isCurrentPlayer: boolean;
  selectedPiece: PieceType | null;
}

const PlayerInfo: React.FC<PlayerInfoProps> = ({ 
  player, 
  inventory, 
  isCurrentPlayer,
  selectedPiece
}) => {
  const playerName = player === Player.PLAYER1 ? 'Player 1' : 'Player 2';
  const playerColor = player === Player.PLAYER1 ? 'text-blue-700' : 'text-red-700';
  
  return (
    <div className={cn(
      "p-3 rounded-lg bg-gray-100 shadow-sm",
      isCurrentPlayer && "ring-2 ring-yellow-400"
    )}>
      <h3 className={cn("text-lg font-bold mb-2", playerColor)}>
        {playerName} {isCurrentPlayer && '(Current Turn)'}
      </h3>
      
      <div className="grid grid-cols-2 gap-2">
        <div className="flex items-center gap-2">
          <GamePiece type={PieceType.ROCK} owner={player} size="sm" 
            selected={selectedPiece === PieceType.ROCK} />
          <span className="text-sm">× {inventory[PieceType.ROCK]}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <GamePiece type={PieceType.PAPER} owner={player} size="sm" 
            selected={selectedPiece === PieceType.PAPER} />
          <span className="text-sm">× {inventory[PieceType.PAPER]}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <GamePiece type={PieceType.SCISSORS} owner={player} size="sm" 
            selected={selectedPiece === PieceType.SCISSORS} />
          <span className="text-sm">× {inventory[PieceType.SCISSORS]}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <GamePiece type={PieceType.SPECIAL} owner={player} size="sm" 
            selected={selectedPiece === PieceType.SPECIAL} />
          <span className="text-sm">× {inventory[PieceType.SPECIAL]}</span>
        </div>
      </div>
    </div>
  );
};

export default PlayerInfo;
