import React from 'react';
import { Button } from '../ui/button';
import { FaStar } from 'react-icons/fa';
import { GamePhase, Player, PieceType } from '../../lib/types';
import { useJankenGame } from '../../lib/stores/useJankenGame';

interface SpecialPieceButtonProps {
  disabled?: boolean;
}

const SpecialPieceButton: React.FC<SpecialPieceButtonProps> = ({ 
  disabled = false 
}) => {
  const { 
    selectSpecialPiece, 
    currentPlayer, 
    phase,
    player1Inventory,
    player2Inventory
  } = useJankenGame();

  const inventory = currentPlayer === Player.PLAYER1 
    ? player1Inventory 
    : player2Inventory;

  const hasSpecialPiece = inventory[PieceType.SPECIAL] > 0;
  const isGameActive = phase === GamePhase.SELECTING_CELL;
  const isButtonDisabled = disabled || !hasSpecialPiece || !isGameActive;

  return (
    <Button 
      variant="outline" 
      size="sm"
      className="flex items-center gap-2"
      onClick={selectSpecialPiece}
      disabled={isButtonDisabled}
    >
      <FaStar className="text-yellow-500" />
      <span>Use Special Piece</span>
    </Button>
  );
};

export default SpecialPieceButton;
