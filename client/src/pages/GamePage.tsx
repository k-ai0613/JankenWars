import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { useGame } from '../lib/stores/useGame';
import { useJankenGame } from '../lib/stores/useJankenGame';
import { PieceType, Player, Position, GameResult } from '../lib/types';
import { useAudio } from '../lib/stores/useAudio';
import { useLanguage } from '../lib/stores/useLanguage';
import Confetti from 'react-confetti';
import { motion, AnimatePresence } from 'framer-motion';

// Components for the game UI
const GameBoard: React.FC = () => {
  const { board, currentPlayer, selectedPiece, selectCell } = useJankenGame();

  const handleSquareClick = (row: number, col: number) => {
    const position: Position = { row, col };
    selectCell(position);
  };

  return (
    <div className="grid grid-cols-6 gap-2 w-full max-w-xl mx-auto">
      {board.map((row, rowIndex) => (
        row.map((cell, colIndex) => (
          <button
            key={`${rowIndex}-${colIndex}`}
            className={`
              w-full aspect-square border-2 p-2 flex items-center justify-center
              ${cell.piece === PieceType.EMPTY ? 'bg-slate-200' : ''}
              ${cell.owner === Player.PLAYER1 ? 'bg-blue-100 border-blue-500' : ''}
              ${cell.owner === Player.PLAYER2 ? 'bg-red-100 border-red-500' : ''}
              ${selectedPiece && cell.piece === PieceType.EMPTY ? 'hover:bg-slate-300' : ''}
              ${cell.piece !== PieceType.EMPTY && cell.owner !== currentPlayer ? 'cursor-not-allowed' : 'cursor-pointer'}
            `}
            onClick={() => handleSquareClick(rowIndex, colIndex)}
          >
            {cell.piece !== PieceType.EMPTY && (
              <GamePiece type={cell.piece} owner={cell.owner} />
            )}
          </button>
        ))
      ))}
    </div>
  );
};

interface GamePieceProps {
  type: PieceType;
  owner: Player;
  selected?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const GamePiece: React.FC<GamePieceProps> = ({ type, owner, selected, size = 'md' }) => {
  // Size classes based on the size prop
  const sizeClasses = {
    sm: 'w-7 h-7 text-sm',
    md: 'w-12 h-12 text-xl',
    lg: 'w-16 h-16 text-2xl',
  }[size];

  // Owner color classes
  const ownerClasses = {
    [Player.PLAYER1]: 'bg-blue-500 text-white',
    [Player.PLAYER2]: 'bg-red-500 text-white',
    [Player.NONE]: 'bg-gray-500 text-white',
  }[owner];

  // Selected styles
  const selectedClasses = selected ? 'ring-4 ring-yellow-400' : '';

  // Icon based on piece type
  const getIcon = () => {
    switch (type) {
      case PieceType.ROCK:
        return '✊';
      case PieceType.PAPER:
        return '✋';
      case PieceType.SCISSORS:
        return '✌️';
      case PieceType.SPECIAL:
        return '⭐';
      default:
        return '';
    }
  };

  return (
    <div 
      className={`rounded-full ${sizeClasses} ${ownerClasses} ${selectedClasses} flex items-center justify-center`}
    >
      {getIcon()}
    </div>
  );
};

interface PlayerInfoProps {
  player: Player;
  inventory: {
    [PieceType.ROCK]: number;
    [PieceType.PAPER]: number;
    [PieceType.SCISSORS]: number;
    [PieceType.SPECIAL]: number;
  };
  isCurrentPlayer: boolean;
  selectedPiece: PieceType | null;
}

const PlayerInfo: React.FC<PlayerInfoProps> = ({ player, inventory, isCurrentPlayer, selectedPiece }) => {
  const { t } = useLanguage();
  const playerKey = player === Player.PLAYER1 ? 'game.player1' : 'game.player2';
  const isActiveClass = isCurrentPlayer 
    ? `bg-gradient-to-r ${player === Player.PLAYER1 ? 'from-blue-50 to-blue-100 border-blue-500' : 'from-red-50 to-red-100 border-red-500'} shadow-md border-2 ring-2 ring-yellow-300` 
    : `bg-slate-50 border-2 ${player === Player.PLAYER1 ? 'border-blue-500' : 'border-red-500'}`;
  
  return (
    <div className={`p-4 rounded-lg ${isActiveClass}`}>
      <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
        {t(playerKey)}
        {isCurrentPlayer && (
          <span className="text-sm bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full font-semibold animate-pulse">
            {t('game.currentTurn')}
          </span>
        )}
      </h3>
      
      <div className="flex flex-wrap gap-2 mb-2">
        <div className="flex items-center gap-1">
          <GamePiece type={PieceType.ROCK} owner={player} size="sm" selected={selectedPiece === PieceType.ROCK} />
          <span>×{inventory[PieceType.ROCK]}</span>
        </div>
        <div className="flex items-center gap-1">
          <GamePiece type={PieceType.PAPER} owner={player} size="sm" selected={selectedPiece === PieceType.PAPER} />
          <span>×{inventory[PieceType.PAPER]}</span>
        </div>
        <div className="flex items-center gap-1">
          <GamePiece type={PieceType.SCISSORS} owner={player} size="sm" selected={selectedPiece === PieceType.SCISSORS} />
          <span>×{inventory[PieceType.SCISSORS]}</span>
        </div>
        <div className="flex items-center gap-1">
          <GamePiece type={PieceType.SPECIAL} owner={player} size="sm" selected={selectedPiece === PieceType.SPECIAL} />
          <span>×{inventory[PieceType.SPECIAL]}</span>
        </div>
      </div>
    </div>
  );
};

export function GamePage() {
  const gameStore = useGame();
  const {
    phase,
    currentPlayer,
    selectedPiece,
    player1Inventory,
    player2Inventory,
    message,
    startGame,
    resetGame,
    selectSpecialPiece,
    result,
    winAnimation,
    drawAnimation,
    loseAnimation,
    clearWinAnimation,
    clearDrawAnimation,
    clearLoseAnimation,
    // getRandomPieceForCurrentPlayer - removed
  } = useJankenGame();
  
  const audioStore = useAudio();
  const { language, setLanguage, t } = useLanguage();

  const handleStartGame = React.useCallback(() => {
    startGame();
    gameStore.start();
    
    // Start background music
    if (audioStore.backgroundMusic) {
      audioStore.backgroundMusic.play().catch(err => {
        console.error('Failed to play background music:', err);
      });
    }
  }, [startGame, gameStore, audioStore]);

  // Initialize audio and auto-start game when component mounts
  useEffect(() => {
    // Set mock audio for now to avoid errors
    if (!audioStore.backgroundMusic) {
      // We'll use empty functions to prevent errors
      audioStore.setBackgroundMusic(new Audio());
      audioStore.setHitSound(new Audio());
      audioStore.setSuccessSound(new Audio());
      
      // Mute by default until we have actual audio files
      audioStore.toggleMute();
    }
    
    // Auto-start the game when the component mounts
    if (gameStore.phase === 'ready') {
      handleStartGame();
    }
  }, [audioStore, gameStore.phase, handleStartGame]);

  // Clean up audio when component unmounts
  useEffect(() => {
    return () => {
      if (audioStore.backgroundMusic) {
        audioStore.backgroundMusic.pause();
      }
    };
  }, [audioStore]);

  const handleResetGame = () => {
    resetGame();
    gameStore.restart();
  };

  const handleToggleMute = () => {
    audioStore.toggleMute();
  };

  const handleToggleLanguage = () => {
    setLanguage(language === 'en' ? 'ja' : 'en');
  };
  
  // Clear animations after a set time
  useEffect(() => {
    if (winAnimation) {
      const timer = setTimeout(() => {
        clearWinAnimation();
      }, 8000); // 8 seconds of celebration is enough
      
      return () => clearTimeout(timer);
    }
  }, [winAnimation, clearWinAnimation]);
  
  useEffect(() => {
    if (drawAnimation) {
      const timer = setTimeout(() => {
        clearDrawAnimation();
      }, 6000); // 6 seconds for draw animation
      
      return () => clearTimeout(timer);
    }
  }, [drawAnimation, clearDrawAnimation]);
  
  useEffect(() => {
    if (loseAnimation) {
      const timer = setTimeout(() => {
        clearLoseAnimation();
      }, 4000); // 4 seconds for lose animation
      
      return () => clearTimeout(timer);
    }
  }, [loseAnimation, clearLoseAnimation]);
  
  // Get window size for confetti
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    const updateWindowSize = () => {
      setWindowSize({ 
        width: window.innerWidth, 
        height: window.innerHeight 
      });
    };
    
    // Set initial size
    updateWindowSize();
    
    // Add resize listener
    window.addEventListener('resize', updateWindowSize);
    
    // Cleanup
    return () => window.removeEventListener('resize', updateWindowSize);
  }, []);

  // Determine confetti colors based on winner
  const getConfettiColors = () => {
    if (result === GameResult.PLAYER1_WIN) {
      return ['#3B82F6', '#93C5FD', '#DBEAFE', '#FFFFFF']; // Blue theme
    } else if (result === GameResult.PLAYER2_WIN) {
      return ['#EF4444', '#FCA5A5', '#FEE2E2', '#FFFFFF']; // Red theme
    } else {
      return ['#10B981', '#A7F3D0', '#D1FAE5', '#FFFFFF']; // Green theme for draw
    }
  };

  return (
    <div className="container mx-auto p-4 min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Animation effects */}
      {winAnimation && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={true}
          numberOfPieces={200}
          gravity={0.2}
          colors={getConfettiColors()}
        />
      )}
      {drawAnimation && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={100}
          gravity={0.3}
          colors={getConfettiColors()}
          tweenDuration={5000}
        />
      )}
      {loseAnimation && (
        <motion.div 
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 0.2, 0],
            transition: { duration: 1.5, repeat: 2, repeatType: "reverse" as const }
          }}
        >
          <div className="w-full h-full bg-red-500 opacity-20"></div>
        </motion.div>
      )}
      
      <div className="flex flex-col items-center">
        {/* Language toggle */}
        <div className="self-end flex items-center space-x-3 mb-4 bg-slate-100 p-3 rounded-lg shadow-md border border-slate-200">
          <span className={`text-sm font-bold transition-colors duration-200 ${language === 'en' ? 'text-blue-600' : 'text-gray-400'}`}>EN</span>
          <div className="relative">
            <Switch 
              checked={language === 'ja'}
              onCheckedChange={handleToggleLanguage}
              className="data-[state=checked]:bg-red-500 data-[state=unchecked]:bg-blue-500 h-6 w-11 [&>span]:data-[state=checked]:bg-white [&>span]:data-[state=unchecked]:bg-white [&>span]:border-2 [&>span]:data-[state=checked]:border-red-600 [&>span]:data-[state=unchecked]:border-blue-600 [&>span]:flex [&>span]:items-center [&>span]:justify-center [&>span]:shadow-md"
            />
            <span className="absolute top-0 left-0 w-full h-full pointer-events-none flex items-center">
              <span className={`absolute text-[8px] font-bold transition-all duration-300 ${language === 'ja' ? 'translate-x-[18px] text-red-600' : 'translate-x-[6px] text-blue-600'}`}>
                {language === 'ja' ? 'JA' : 'EN'}
              </span>
            </span>
          </div>
          <span className={`text-sm font-bold transition-colors duration-200 ${language === 'ja' ? 'text-red-600' : 'text-gray-400'}`}>日本語</span>
        </div>

        <h1 className="text-3xl font-bold mb-4 text-center">{t('game.title')}</h1>

        {/* Game controls */}
        <div className="flex gap-2 mb-6 flex-wrap justify-center">
          {gameStore.phase === 'ready' && (
            <Button onClick={handleStartGame} size="lg">
              {t('game.startGame')}
            </Button>
          )}
          
          {gameStore.phase === 'playing' && (
            <>
              <Button onClick={selectSpecialPiece} 
                disabled={currentPlayer === Player.PLAYER1 
                  ? player1Inventory[PieceType.SPECIAL] <= 0 
                  : player2Inventory[PieceType.SPECIAL] <= 0}
                variant="outline">
                {t('game.useSpecialPiece')}
              </Button>
              
              <Button onClick={handleResetGame} variant="secondary">
                {t('game.reset')}
              </Button>
            </>
          )}
          
          {gameStore.phase === 'ended' && (
            <Button onClick={handleResetGame} size="lg">
              {t('game.playAgain')}
            </Button>
          )}
          
          <Button onClick={handleToggleMute} variant="ghost">
            {audioStore.isMuted ? t('game.unmute') : t('game.mute')}
          </Button>
          
          <Link to="/">
            <Button variant="ghost">{t('game.backToHome')}</Button>
          </Link>
        </div>

        {/* Game message */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={message} // Forces re-animation when message changes
            initial={{ opacity: 0, y: -20 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              scale: winAnimation ? [1, 1.05, 1] : 1,
              transition: { 
                duration: winAnimation ? 1 : 0.3,
                repeat: winAnimation ? 5 : 0,
                repeatType: "reverse" as const
              }
            }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className={`p-6 rounded-lg shadow-md mb-6 w-full max-w-xl text-center min-h-[80px] flex items-center justify-center
              ${winAnimation ? 'ring-4 ring-yellow-400 bg-gradient-to-r from-yellow-50 to-yellow-100' : 'bg-white'}
              ${drawAnimation ? 'ring-4 ring-green-400 bg-gradient-to-r from-green-50 to-green-100' : ''}
              ${loseAnimation ? 'ring-2 ring-red-300 bg-gradient-to-r from-red-50 to-red-100' : ''}
            `}
          >
            <p className={`
              text-base md:text-lg
              ${winAnimation ? 'font-bold animate-pulse' : ''}
              ${drawAnimation ? 'font-semibold' : ''}
              ${loseAnimation ? 'font-medium text-red-600' : ''}
              ${!winAnimation && !drawAnimation && !loseAnimation ? 'font-medium' : ''}
            `}>
              {message.startsWith('message.') ? t(message) : message}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Players info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl mb-8">
          <PlayerInfo 
            player={Player.PLAYER1} 
            inventory={player1Inventory} 
            isCurrentPlayer={currentPlayer === Player.PLAYER1}
            selectedPiece={selectedPiece}
          />
          <PlayerInfo 
            player={Player.PLAYER2} 
            inventory={player2Inventory} 
            isCurrentPlayer={currentPlayer === Player.PLAYER2}
            selectedPiece={selectedPiece}
          />
        </div>

        {/* Game board */}
        <GameBoard />
      </div>
    </div>
  );
}
