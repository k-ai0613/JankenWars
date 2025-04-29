import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { useGame } from '../lib/stores/useGame';
import { useJankenGame } from '../lib/stores/useJankenGame';
import { PieceType, Player, Position } from '../lib/types';
import { useAudio } from '../lib/stores/useAudio';
import { useLanguage } from '../lib/stores/useLanguage';

// Components for the game UI
const GameBoard: React.FC = () => {
  const { board, currentPlayer, selectedPiece, selectCell } = useJankenGame();

  const handleSquareClick = (row: number, col: number) => {
    const position: Position = { row, col };
    selectCell(position);
  };

  return (
    <div className="grid grid-cols-6 gap-1 w-full max-w-md mx-auto">
      {board.map((row, rowIndex) => (
        row.map((cell, colIndex) => (
          <button
            key={`${rowIndex}-${colIndex}`}
            className={`
              w-full aspect-square border-2 p-1 flex items-center justify-center
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
    sm: 'w-6 h-6 text-xs',
    md: 'w-10 h-10 text-md',
    lg: 'w-12 h-12 text-lg',
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
  const colorClass = player === Player.PLAYER1 ? 'border-blue-500' : 'border-red-500';
  const isActiveClass = isCurrentPlayer ? 'bg-slate-100 shadow-md' : 'bg-slate-50';
  
  return (
    <div className={`p-4 rounded-lg border-2 ${colorClass} ${isActiveClass}`}>
      <h3 className="font-bold text-lg mb-2">{t(playerKey)}{isCurrentPlayer ? t('game.currentTurn') : ''}</h3>
      
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
    getRandomPieceForCurrentPlayer
  } = useJankenGame();
  
  const audioStore = useAudio();
  const { language, setLanguage, t } = useLanguage();

  // Initialize audio when component mounts - currently disabled to avoid empty file errors
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
  }, [audioStore]);

  // Clean up audio when component unmounts
  useEffect(() => {
    return () => {
      if (audioStore.backgroundMusic) {
        audioStore.backgroundMusic.pause();
      }
    };
  }, [audioStore]);

  const handleStartGame = () => {
    startGame();
    gameStore.start();
    
    // Start background music
    if (audioStore.backgroundMusic) {
      audioStore.backgroundMusic.play().catch(err => {
        console.error('Failed to play background music:', err);
      });
    }
  };

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

  return (
    <div className="container mx-auto p-4 min-h-screen bg-slate-50">
      <div className="flex flex-col items-center">
        {/* Language toggle */}
        <div className="self-end flex items-center space-x-3 mb-4 bg-slate-100 p-3 rounded-lg shadow-md border border-slate-200">
          <span className={`text-sm font-bold transition-colors duration-200 ${language === 'en' ? 'text-blue-600' : 'text-gray-400'}`}>EN</span>
          <div className="relative">
            <Switch 
              checked={language === 'ja'}
              onCheckedChange={handleToggleLanguage}
              className="data-[state=checked]:bg-red-500 data-[state=unchecked]:bg-blue-500 h-6 w-11"
            />
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
              
              <Button onClick={getRandomPieceForCurrentPlayer} variant="outline">
                {t('game.getRandomPiece')}
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
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6 w-full max-w-md text-center">
          <p>{message.startsWith('message.') ? t(message) : message}</p>
        </div>

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
