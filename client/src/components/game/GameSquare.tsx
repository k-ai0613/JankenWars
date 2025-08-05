import React from 'react';
import { GamePiece } from './GamePiece';
import { Cell, Position, PieceType, Player, normalizePlayer } from '../../lib/types';
import { cn } from '../../lib/utils';
import { useJankenGame } from '../../lib/stores/useJankenGame';

interface GameSquareProps {
  cell: Cell;
  position: Position;
  isValidMove: boolean;
  isWinningCell?: boolean;
  onClick: (position: Position) => void;
  isMobile?: boolean;
}

const GameSquare: React.FC<GameSquareProps> = ({ 
  cell, 
  position, 
  isValidMove,
  isWinningCell = false,
  onClick,
  isMobile = false
}) => {
  const { isAIEnabled, isAIThinking, currentPlayer, phase, selectedPiece } = useJankenGame();
  
  // AIのターン中かどうかチェック
  const isAITurn = isAIEnabled && currentPlayer === Player.PLAYER2;
  // AI操作中かどうか
  const isDisabledDueToAI = isAITurn || isAIThinking;
  
  const handleClick = (e: React.MouseEvent) => {
    console.log(`[GameSquare] Clicked cell at (${position.row}, ${position.col}). isValidMove: ${isValidMove}, isDisabledDueToAI: ${isDisabledDueToAI}`);
    
    // イベントのデフォルト動作を防止
    e.preventDefault();
    e.stopPropagation();
    
    // AI操作中はクリック無効化
    if (isDisabledDueToAI) {
      console.log('[GameSquare] AI is currently playing, please wait...');
      return;
    }
    
    // セルがすでに使用済みの場合もクリックを無効化
    if (cell.hasBeenUsed && cell.piece !== PieceType.EMPTY) {
      console.log(`[GameSquare] Cell (${position.row}, ${position.col}) is already occupied.`);
      return;
    }
    
    // 有効な手かどうかを含めてクリックイベントを親コンポーネントに伝達
    console.log(`[GameSquare] Sending click event to parent. selectedPiece: ${selectedPiece}`);
    onClick(position);
  };

  // 型安全なPlayer比較のために normalizePlayer を使用
  const normalizedOwner = normalizePlayer(cell.owner);
  
  // 明示的なEnum比較で所有者を判定
  const isPlayer1 = normalizedOwner === Player.PLAYER1;
  const isPlayer2 = normalizedOwner === Player.PLAYER2;
  
  // シンプルな背景色選択ロジック
  let bgColorClass = "";
  
  if (isWinningCell) {
    if (isPlayer1) {
      bgColorClass = "bg-blue-500 border-2 border-yellow-300 animate-pulse";
    } else if (isPlayer2) {
      bgColorClass = "bg-red-500 border-2 border-yellow-300 animate-pulse";
    } else {
      bgColorClass = "bg-amber-400 border-2 border-yellow-300 animate-pulse";
    }
  }
  else if (isValidMove) {
    bgColorClass = isDisabledDueToAI
      ? "bg-gray-300 cursor-not-allowed"
      : "bg-green-300 cursor-pointer hover:bg-green-400";
  } 
  else if (cell.hasBeenUsed) {
    bgColorClass = "bg-amber-400";
  }
  else if (cell.piece !== PieceType.EMPTY) {
    if (isPlayer1) {
      bgColorClass = "bg-blue-400";
    } 
    else if (isPlayer2) {
      bgColorClass = "bg-red-400";
    }
    else {
      bgColorClass = "bg-gray-400";
    }
  }
  else {
    // AI操作中は通常のセルもクリックできないようにする
    bgColorClass = isDisabledDueToAI
      ? "bg-amber-100 cursor-not-allowed"
      : "bg-amber-100 hover:bg-amber-200 cursor-pointer";
  }
  
  return (
    <button 
      className={cn(
        "w-full h-full flex items-center justify-center",
        isMobile ? "min-w-[35px] min-h-[35px]" : "min-w-[45px] min-h-[45px]",
        "shadow-inner",
        bgColorClass
      )}
      onClick={handleClick}
      data-testid={`cell-${position.row}-${position.col}`}
      data-position={`${position.row}-${position.col}`}
      data-valid-move={isValidMove.toString()}
      data-winning-cell={isWinningCell.toString()}
      disabled={isDisabledDueToAI}
    >
      {/* Game piece */}
      {cell.piece && cell.piece !== PieceType.EMPTY && (
        <GamePiece
          type={cell.piece}
          owner={normalizedOwner}
          size="auto"
        />
      )}
    </button>
  );
};

export default GameSquare;
