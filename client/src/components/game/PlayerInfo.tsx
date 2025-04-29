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
  
  const bgGradient = player === Player.PLAYER1 
    ? 'bg-gradient-to-br from-blue-50 to-indigo-100' 
    : 'bg-gradient-to-br from-red-50 to-pink-100';
    
  const borderColor = player === Player.PLAYER1 
    ? 'border-blue-200' 
    : 'border-red-200';
    
  const glowColor = player === Player.PLAYER1 
    ? 'shadow-blue-300/50' 
    : 'shadow-red-300/50';
    
  return (
    <div className={cn(
      `p-4 rounded-xl ${bgGradient} shadow-md border ${borderColor}`,
      "transition-all duration-300 backdrop-blur-sm",
      isCurrentPlayer && `ring-2 ${player === Player.PLAYER1 ? 'ring-blue-400' : 'ring-red-400'} shadow-lg ${glowColor}`
    )}>
      <h3 className={cn(
        "text-lg font-bold mb-3", 
        playerColor,
        isCurrentPlayer && "animate-pulse"
      )}>
        {playerName} {isCurrentPlayer && '(Current Turn)'}
      </h3>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-white/50 backdrop-blur-sm border border-slate-100 shadow-sm">
          <div className="flex-shrink-0">
            <GamePiece type={PieceType.ROCK} owner={player} size="sm" 
              selected={selectedPiece === PieceType.ROCK} />
          </div>
          <span className={`text-sm font-medium ${selectedPiece === PieceType.ROCK ? 'font-bold' : ''}`}>
            × {inventory[PieceType.ROCK]}
          </span>
        </div>
        
        <div className="flex items-center gap-2 p-2 rounded-lg bg-white/50 backdrop-blur-sm border border-slate-100 shadow-sm">
          <div className="flex-shrink-0">
            <GamePiece type={PieceType.PAPER} owner={player} size="sm" 
              selected={selectedPiece === PieceType.PAPER} />
          </div>
          <span className={`text-sm font-medium ${selectedPiece === PieceType.PAPER ? 'font-bold' : ''}`}>
            × {inventory[PieceType.PAPER]}
          </span>
        </div>
        
        <div className="flex items-center gap-2 p-2 rounded-lg bg-white/50 backdrop-blur-sm border border-slate-100 shadow-sm">
          <div className="flex-shrink-0">
            <GamePiece type={PieceType.SCISSORS} owner={player} size="sm" 
              selected={selectedPiece === PieceType.SCISSORS} />
          </div>
          <span className={`text-sm font-medium ${selectedPiece === PieceType.SCISSORS ? 'font-bold' : ''}`}>
            × {inventory[PieceType.SCISSORS]}
          </span>
        </div>
        
        <div className="flex items-center gap-2 p-2 rounded-lg bg-white/50 backdrop-blur-sm border border-slate-100 shadow-sm">
          <div className="flex-shrink-0">
            <GamePiece type={PieceType.SPECIAL} owner={player} size="sm" 
              selected={selectedPiece === PieceType.SPECIAL} />
          </div>
          <span className={`text-sm font-medium ${selectedPiece === PieceType.SPECIAL ? 'font-bold' : ''}`}>
            × {inventory[PieceType.SPECIAL]}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PlayerInfo;
