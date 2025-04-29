import React from 'react';
import { PieceType, Player, normalizePlayer } from '../../lib/types';
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
  
  // 明示的にスタイルを定義 - 明確な条件分岐で信頼性を高める
  let ownerColor = '';
  let borderColorClass = '';
  let bgColorClass = '';
  
  // 所有者の文字列表現を取得して完全なデバッグデータを書き出す
  const ownerAsString = String(owner).toUpperCase();
  
  console.log('GamePiece [DEBUG]:', { 
    owner, 
    type,
    ownerAsString,
    rawOwner: owner,
    ownerType: typeof owner,
    isP1direct: owner === Player.PLAYER1, 
    isP2direct: owner === Player.PLAYER2,
    isP1string: ownerAsString === 'PLAYER1',
    isP2string: ownerAsString === 'PLAYER2',
    isP1includes: ownerAsString.includes('PLAYER1'),
    isP2includes: ownerAsString.includes('PLAYER2'),
  });

  // 完全にハードコードされた条件分岐で判断 - 文字列で決定
  if (ownerAsString === 'PLAYER1' || ownerAsString.includes('PLAYER1')) {
    // Player 1のスタイル - 青色 - より濃い色に変更
    ownerColor = 'text-blue-800 font-bold text-3xl';
    borderColorClass = 'border-blue-600 border-2';
    bgColorClass = 'bg-blue-200';
    console.log('✅ PLAYER1 STYLE APPLIED (STRONGER BLUE)', { owner, ownerAsString });
  } 
  else if (ownerAsString === 'PLAYER2' || ownerAsString.includes('PLAYER2')) {
    // Player 2のスタイル - 赤色 - より鮮やかな赤に変更
    ownerColor = 'text-red-800 font-bold text-3xl';
    borderColorClass = 'border-red-600 border-2';
    bgColorClass = 'bg-red-200';
    console.log('✅ PLAYER2 STYLE APPLIED (STRONGER RED):', { owner, ownerAsString, type });
  }
  else {
    // デフォルトスタイル
    ownerColor = 'text-gray-800 font-bold text-3xl';
    borderColorClass = 'border-gray-400';
    bgColorClass = 'bg-white';
  }
  
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
  
  // すべてのクラスを結合
  const pieceClass = `${ownerColor} ${containerSize} rounded-full ${bgColorClass} border-2 ${borderColorClass} shadow-md flex items-center justify-center relative`;

  // Selected piece has a highlight
  const selectedClass = selected ? 'ring-2 ring-yellow-400' : '';

  // Render the appropriate icon based on piece type with larger, more visible emoji
  // In Japanese Janken Rules:
  // - Rock (グー) beats Scissors (チョキ)
  // - Scissors (チョキ) beats Paper (パー)
  // - Paper (パー) beats Rock (グー)
  // Using larger, more distinct emoji symbols
  const renderPieceIcon = () => {
    // Using more vibrant, larger emojis for better visibility
    const style = { fontSize: '2rem' }; // Larger font size for icons
    
    switch (type) {
      case PieceType.ROCK: // グー (Rock, 拳を握った形) - Beats Scissors
        return <span style={style}>✊</span>;
      case PieceType.PAPER: // パー (Paper, 手のひらを広げた形) - Beats Rock
        return <span style={style}>✋</span>;
      case PieceType.SCISSORS: // チョキ (Scissors, 人差し指と中指を出した形) - Beats Paper
        return <span style={style}>✌️</span>;
      case PieceType.SPECIAL: // 特殊駒 (Special, 星マーク) - Can't attack or be attacked
        return <span style={style}>⭐</span>;
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
