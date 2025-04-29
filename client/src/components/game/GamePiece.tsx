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
  
  // Determine owner color styles - stronger text colors for maximum visibility
  // Ensure the correct owner colors are being used
  let ownerColor = 'text-gray-800 font-bold text-3xl'; // Default fallback
  
  // 超強力なプレイヤー識別ロジックを実装
  // 文字列比較、列挙体比較、内部値比較など複数の識別方法を使用
  const ownerStr = String(owner);
  const ownerType = typeof owner;
  const isP1ByString = ownerStr.includes('PLAYER1');
  const isP2ByString = ownerStr.includes('PLAYER2');
  const isP1ByEnum = owner === Player.PLAYER1;
  const isP2ByEnum = owner === Player.PLAYER2;
  
  console.log('GamePiece owner DETAILED check:', { 
    owner, 
    ownerStr, 
    ownerType,
    isP1ByString,
    isP2ByString,
    isP1ByEnum,
    isP2ByEnum,
    // プレイヤー列挙体の値を確認
    Player1Value: Player.PLAYER1,
    Player2Value: Player.PLAYER2,
    Player1Str: String(Player.PLAYER1),
    Player2Str: String(Player.PLAYER2)
  });
  
  // 複数の条件を考慮してプレイヤーを識別
  const isPlayer1 = isP1ByEnum || isP1ByString;
  const isPlayer2 = isP2ByEnum || isP2ByString || ownerStr === 'PLAYER2';
  
  if (isPlayer1) {
    ownerColor = 'text-blue-800 font-bold text-3xl';
  } else if (isPlayer2) {
    ownerColor = 'text-red-800 font-bold text-3xl';
    console.log('PLAYER2 COLOR APPLIED TO:', { position: owner, type });
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
  
  // Combine all classes - using common white background for all pieces with improved styling and safer owner check
  let borderColorClass = 'border-gray-500'; // Default fallback
  
  // プレイヤー識別結果をボーダーカラーにも反映
  if (isPlayer1) {
    borderColorClass = 'border-blue-500';
  } else if (isPlayer2) {
    borderColorClass = 'border-red-500';
    console.log('PLAYER2 BORDER COLOR APPLIED');
  }
  
  const pieceClass = `${ownerColor} ${containerSize} rounded-full bg-white border-2 ${borderColorClass} shadow-md flex items-center justify-center relative`;

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
