import React from 'react';
import { Button } from '../ui/button';
import { FaStar } from 'react-icons/fa';
import { GamePhase, Player, PieceType } from '../../lib/types';
import { useJankenGame } from '../../lib/stores/useJankenGame';
import { useLanguage } from '../../lib/stores/useLanguage';

interface SpecialPieceButtonProps {
  disabled?: boolean;
}

const SpecialPieceButton: React.FC<SpecialPieceButtonProps> = ({
  disabled = false,
}) => {
  // The store has never exposed a selectSpecialPiece action, so onClick was
  // undefined and this button did nothing. Selecting the special piece goes
  // through setSelectedPiece like every other piece.
  const {
    setSelectedPiece,
    currentPlayer,
    phase,
    player1Inventory,
    player2Inventory,
  } = useJankenGame();
  const { t } = useLanguage();

  const inventory = currentPlayer === Player.PLAYER1 ? player1Inventory : player2Inventory;

  const hasSpecialPiece = (inventory?.[PieceType.SPECIAL] ?? 0) > 0;
  const isGameActive = phase === GamePhase.SELECTING_CELL;
  const isButtonDisabled = disabled || !hasSpecialPiece || !isGameActive;

  return (
    <Button
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
      onClick={() => setSelectedPiece(PieceType.SPECIAL)}
      disabled={isButtonDisabled}
    >
      <FaStar className="text-yellow-500" />
      <span>{t('game.useSpecialPiece')}</span>
    </Button>
  );
};

export default SpecialPieceButton;
