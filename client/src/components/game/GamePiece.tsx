import React from 'react';
import { PieceType, Player, normalizePlayer } from '../../lib/types';
import { FaHandRock, FaHandPaper, FaHandScissors, FaStar } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

interface GamePieceProps {
  type: PieceType;
  owner: Player;
  selected?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'auto';
}

export const GamePiece: React.FC<GamePieceProps> = ({
  type,
  owner,
  selected = false,
  size = 'md',
}) => {
  // 所有者の型を安全に変換
  const normalizedOwner = normalizePlayer(owner);

  if (type === PieceType.EMPTY) {
    return null;
  }

  // Determine font size based on the size prop
  const fontSize = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    auto: 'text-base md:text-xl lg:text-2xl', // レスポンシブフォントサイズ
  }[size];

  const containerSize = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    auto: 'w-7 h-7 md:w-9 md:h-9 lg:w-11 lg:h-11' // レスポンシブサイズ
  }[size];
  
  // 明示的にスタイルを定義 - 明確な条件分岐で信頼性を高める
  let ownerColor = '';
  let borderColorClass = '';
  let bgColorClass = '';
  
  // 所有者の文字列表現を取得して完全なデバッグデータを書き出す
  const ownerAsString = String(normalizedOwner).toUpperCase();
  
  // console.log('GamePiece [DEBUG]:', { 
  //   ownerType: typeof normalizedOwner,
  //   normalizedOwner,
  //   type,
  //   ownerAsString,
  //   isP1direct: normalizedOwner === Player.PLAYER1, 
  //   isP2direct: normalizedOwner === Player.PLAYER2,
  // });

  // 正規化されたPlayerの値でスタイルを決定
  if (normalizedOwner === Player.PLAYER1) {
    // Player 1のスタイル - 青色 - 極めて鮮明な色にする
    ownerColor = 'text-white font-extrabold text-3xl';
    borderColorClass = 'border-blue-800 border-[2px] md:border-[3px]'; // モバイル対応で境界線調整
    bgColorClass = 'bg-blue-600';
    // console.log('✅ PLAYER1 STYLE APPLIED (VIVID BLUE)');
  } 
  else if (normalizedOwner === Player.PLAYER2) {
    // Player 2のスタイル - 赤色 - 極めて鮮明な色にする
    ownerColor = 'text-white font-extrabold text-3xl';
    borderColorClass = 'border-red-800 border-[2px] md:border-[3px]'; // モバイル対応で境界線調整
    bgColorClass = 'bg-red-600';
    // console.log('✅ PLAYER2 STYLE APPLIED (VIVID RED)');
  }
  else {
    // デフォルトスタイル
    ownerColor = 'text-gray-800 font-bold text-3xl';
    borderColorClass = 'border-gray-400';
    bgColorClass = 'bg-white';
    // console.log('⚠️ DEFAULT STYLE APPLIED (NO OWNER MATCH)');
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
    sm: 'w-3.5 h-3.5 text-[8px] -mt-0.5 -mr-0.5',
    md: 'w-5 h-5 text-[10px] -mt-1 -mr-1',
    lg: 'w-6 h-6 text-xs -mt-1.5 -mr-1.5',
    auto: 'w-3.5 h-3.5 text-[7px] -mt-0.5 -mr-0.5 md:w-4.5 md:h-4.5 md:text-[9px] md:-mt-1 md:-mr-1 lg:w-5.5 lg:h-5.5 lg:text-[11px] lg:-mt-1 lg:-mr-1' // レスポンシブサイズ
  }[size];
  
  // すべてのクラスを結合
  const pieceClass = `${ownerColor} ${containerSize} rounded-full ${bgColorClass} ${borderColorClass} shadow-md flex items-center justify-center relative`;

  // Selected piece has a highlight
  const selectedClass = selected ? 'ring-2 ring-yellow-400' : '';

  // Render the appropriate icon based on piece type with larger, more visible emoji
  // In Japanese Janken Rules:
  // - Rock (グー) beats Scissors (チョキ)
  // - Scissors (チョキ) beats Paper (パー)
  // - Paper (パー) beats Rock (グー)
  // Using larger, more distinct emoji symbols
  const renderPieceIcon = () => {
    // スマートフォン対応のレスポンシブなアイコンサイズ
    const getIconSizeClass = () => {
      if (size === 'auto') {
        // レスポンシブなフォントサイズクラス
        return 'text-lg sm:text-xl md:text-2xl lg:text-3xl';
      } else {
        const fontSizesClasses = {
          sm: 'text-lg',
          md: 'text-2xl',
          lg: 'text-3xl'
        };
        return fontSizesClasses[size] || 'text-2xl';
      }
    };

    const iconSizeClass = getIconSizeClass();

    switch (type) {
      case PieceType.ROCK:
        return <span className={iconSizeClass}>✊</span>;
      case PieceType.PAPER:
        return <span className={iconSizeClass}>✋</span>;
      case PieceType.SCISSORS:
        return <span className={iconSizeClass}>✌️</span>;
      case PieceType.SPECIAL:
        return <span className={iconSizeClass}>⭐</span>;
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
    <div className={`flex items-center justify-center ${selectedClass} touch-manipulation`}>
      <div className={pieceClass}>
        {renderPieceIcon()}
        <div className={`absolute top-0 right-0 ${labelSize} bg-white text-black font-bold rounded-full flex items-center justify-center shadow-sm border border-gray-300`}>
          {pieceLabel}
        </div>
      </div>
    </div>
  );
};
