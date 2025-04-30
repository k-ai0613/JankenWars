import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { useGame } from '../lib/stores/useGame';
import { useJankenGame } from '../lib/stores/useJankenGame';
import { AIDifficulty } from '../lib/aiUtils';
import { PieceType, Player, Position, GameResult } from '../lib/types';
import { useAudio } from '../lib/stores/useAudio';
import { useLanguage } from '../lib/stores/useLanguage';
import { soundService } from '../lib/soundService';
import Confetti from 'react-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { FaStar, FaRobot, FaChessKnight, FaUserFriends } from 'react-icons/fa';

// Import GameBoard component
import GameBoard from '../components/game/GameBoard';

// Import GamePiece component
import { GamePiece } from '../components/game/GamePiece';

// Import PlayerInfo component
import PlayerInfo from '../components/game/PlayerInfo';
import { AudioControl } from '../components/game/AudioControl';

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
    // AI related
    isAIEnabled,
    aiDifficulty,
    isAIThinking,
    toggleAI,
    setAIDifficulty,
    // getRandomPieceForCurrentPlayer - removed
  } = useJankenGame();
  
  const audioStore = useAudio();
  const { language, setLanguage, t } = useLanguage();

  const handleStartGame = React.useCallback(() => {
    startGame();
    gameStore.start();
  }, [startGame, gameStore]);

  // Initialize audio and auto-start game when component mounts
  useEffect(() => {
    // Auto-start the game when the component mounts
    if (gameStore.phase === 'ready') {
      handleStartGame();
    }
  }, [gameStore.phase, handleStartGame]);
  
  // Check for AI mode from home screen (separate effect to ensure it runs after game starts)
  useEffect(() => {
    const aiModeFromHome = localStorage.getItem('ai_mode');
    console.log('Checking AI mode from home:', aiModeFromHome, isAIEnabled);
    
    if (aiModeFromHome === 'true') {
      console.log('Enabling AI mode from home screen selection');
      // Clear the flag immediately to prevent multiple activations
      localStorage.removeItem('ai_mode');
      
      // Enable AI with a slight delay to ensure game is initialized
      setTimeout(() => {
        if (!isAIEnabled) {
          toggleAI(); // Enable AI
          setAIDifficulty(AIDifficulty.MEDIUM); // Set default difficulty
          console.log('AI mode enabled with MEDIUM difficulty');
        }
      }, 500);
    }
  }, [toggleAI, isAIEnabled, setAIDifficulty]);

  // Clean up audio when component unmounts
  useEffect(() => {
    return () => {
      // Use the useAudio store to stop all sounds
      audioStore.stopAllSounds();
    };
  }, [audioStore]);

  const handleResetGame = () => {
    // Remember AI status to keep it enabled after reset
    const wasAIEnabled = isAIEnabled;
    const currentDifficulty = aiDifficulty;
    
    resetGame();
    gameStore.restart();
    
      // バトルパターン機能を完全に削除（ユーザーリクエスト）
    console.log('[RESET] Game reset complete');
    
    // Re-enable AI if it was enabled before reset
    if (wasAIEnabled) {
      setTimeout(() => {
        toggleAI();
        setAIDifficulty(currentDifficulty);
      }, 300);
    }
  };

  const handleToggleMute = () => {
    audioStore.toggleMute();
  };

  const handleToggleLanguage = () => {
    setLanguage(language === 'en' ? 'ja' : 'en');
  };
  
  // AI related handlers
  const handleToggleAI = () => {
    toggleAI();
  };
  
  const handleSetAIDifficulty = (difficulty: AIDifficulty) => {
    setAIDifficulty(difficulty);
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
    <div className="container mx-auto px-4 pt-2 pb-0 min-h-screen relative overflow-hidden bg-gradient-to-b from-blue-50 via-indigo-50 to-purple-50">
      {/* Audio Control Button */}
      <AudioControl />
      
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
        <>
          <motion.div 
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.3, 0],
              transition: { duration: 0.7, repeat: 4, repeatType: "reverse" as const }
            }}
          >
            <div className="w-full h-full bg-red-500 opacity-30"></div>
          </motion.div>
          
          {/* ゲームオーバーのビジュアルエフェクト - 落下する碁石アニメーション */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 15 }).map((_, i) => (
              <motion.div
                key={`falling-piece-${i}`}
                className="absolute"
                initial={{ 
                  x: `${Math.random() * 100}vw`, 
                  y: -100, 
                  rotate: 0,
                  opacity: 0.9
                }}
                animate={{ 
                  y: '120vh',
                  rotate: Math.random() > 0.5 ? 360 : -360,
                  opacity: [0.9, 0.7, 0]
                }}
                transition={{ 
                  duration: 3 + Math.random() * 4,
                  ease: "easeIn",
                  delay: Math.random() * 1
                }}
              >
                <div className={`w-8 h-8 rounded-full ${
                  Math.random() > 0.5 
                    ? 'bg-blue-500 border-2 border-blue-600' 
                    : 'bg-red-500 border-2 border-red-600'
                }`}></div>
              </motion.div>
            ))}
          </div>
        </>
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

        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 drop-shadow-sm">{t('game.title')}</h1>

        {/* Game controls */}
        <div className="flex gap-3 mb-4 flex-wrap justify-center">
          {gameStore.phase === 'ready' && (
            <Button onClick={handleStartGame} 
              className="py-6 px-8 text-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/20 hover:shadow-blue-600/30 transition-all duration-300" 
              size="lg">
              {t('game.startGame')}
            </Button>
          )}
          
          {gameStore.phase === 'playing' && (
            <>
              <Button onClick={selectSpecialPiece} 
                disabled={currentPlayer === Player.PLAYER1 
                  ? player1Inventory[PieceType.SPECIAL] <= 0 
                  : player2Inventory[PieceType.SPECIAL] <= 0}
                className="bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200 shadow-md"
                variant="outline">
                <span className="flex items-center">
                  <FaStar className="mr-2 text-yellow-500" />
                  {t('game.useSpecialPiece')}
                </span>
              </Button>
              
              <Button onClick={handleResetGame} 
                className="bg-white/80 backdrop-blur-sm text-slate-700 hover:bg-white/90 shadow-md"
                variant="secondary">
                {t('game.reset')}
              </Button>
            </>
          )}
          
          {gameStore.phase === 'ended' && (
            <Button onClick={handleResetGame} 
              className="py-5 px-6 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/20 hover:shadow-purple-600/30 transition-all duration-300" 
              size="lg">
              {t('game.playAgain')}
            </Button>
          )}
          
{/* ミュートボタンはAudioControlコンポーネントで提供されています */}
          
          <Link to="/">
            <Button 
              className="bg-white/60 hover:bg-white/80 backdrop-blur-sm text-slate-600 hover:text-slate-900 border border-slate-200 shadow-sm"
              variant="ghost">
              {t('game.backToHome')}
            </Button>
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 w-full max-w-7xl mx-auto mb-4">
          {/* Left column - Player info and messages */}
          <div className="lg:w-1/3 flex flex-col gap-4">
            {/* Game message */}
            <AnimatePresence mode="wait">
              <motion.div 
                key={message} // Forces re-animation when message changes
                initial={{ opacity: 0, y: -20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  scale: winAnimation ? [1, 1.05, 1] : (loseAnimation ? [1, 0.95, 1] : 1),
                  rotate: loseAnimation ? [0, -1, 1, -1, 0] : 0,
                  transition: { 
                    duration: winAnimation ? 1 : (loseAnimation ? 0.5 : 0.3),
                    repeat: winAnimation ? 5 : (loseAnimation ? 3 : 0),
                    repeatType: "reverse" as const
                  }
                }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className={`p-3 rounded-lg shadow-md w-full text-center min-h-[70px] flex items-center justify-center
                  ${winAnimation ? 'ring-4 ring-yellow-400 bg-gradient-to-r from-yellow-50 to-yellow-100' : 'bg-white'}
                  ${drawAnimation ? 'ring-4 ring-green-400 bg-gradient-to-r from-green-50 to-green-100' : ''}
                  ${loseAnimation ? 'ring-4 ring-red-400 bg-gradient-to-r from-red-50 to-red-100 shadow-lg shadow-red-200/50' : ''}
                `}
              >
                <p className={`
                  text-base
                  ${winAnimation ? 'font-bold animate-pulse' : ''}
                  ${drawAnimation ? 'font-semibold' : ''}
                  ${loseAnimation ? 'font-bold text-red-600 animate-[shake_0.5s_ease-in-out_infinite]' : ''}
                  ${!winAnimation && !drawAnimation && !loseAnimation ? 'font-medium' : ''}
                `}>
                  {message.startsWith('message.') ? t(message) : message}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* AI Controls */}
            <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md border border-slate-200 p-3 mb-3">
              <h3 className="text-lg font-bold mb-3 flex items-center">
                <FaRobot className="mr-2 text-slate-600" />
                {t('game.aiControls')}
              </h3>
              
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <span className="text-sm font-medium mr-2">
                    {isAIEnabled ? t('game.aiEnabled') : t('game.aiDisabled')}
                  </span>
                  {isAIThinking && (
                    <div className="ml-2 animate-pulse flex items-center">
                      <span className="text-xs text-blue-600 font-semibold">
                        {t('game.aiThinking')}
                      </span>
                      <span className="ml-1 flex space-x-1">
                        <span className="h-1.5 w-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="h-1.5 w-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="h-1.5 w-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </span>
                    </div>
                  )}
                </div>
                <Switch 
                  checked={isAIEnabled}
                  onCheckedChange={handleToggleAI}
                  className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-slate-300 h-6 w-11"
                />
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium mb-2">
                  {t('game.aiDifficulty')}:
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    onClick={() => handleSetAIDifficulty(AIDifficulty.BEGINNER)}
                    variant={aiDifficulty === AIDifficulty.BEGINNER ? 'default' : 'outline'}
                    size="sm"
                    className={aiDifficulty === AIDifficulty.BEGINNER ? 'bg-blue-400 hover:bg-blue-500' : 'hover:bg-blue-50'}
                  >
                    {t('game.aiBeginner') || 'Beginner'}
                  </Button>
                  <Button 
                    onClick={() => handleSetAIDifficulty(AIDifficulty.EASY)}
                    variant={aiDifficulty === AIDifficulty.EASY ? 'default' : 'outline'}
                    size="sm"
                    className={aiDifficulty === AIDifficulty.EASY ? 'bg-green-400 hover:bg-green-500' : 'hover:bg-green-50'}
                  >
                    {t('game.aiEasy')}
                  </Button>
                  <Button 
                    onClick={() => handleSetAIDifficulty(AIDifficulty.NORMAL)}
                    variant={aiDifficulty === AIDifficulty.NORMAL ? 'default' : 'outline'}
                    size="sm"
                    className={aiDifficulty === AIDifficulty.NORMAL ? 'bg-cyan-500 hover:bg-cyan-600' : 'hover:bg-cyan-50'}
                  >
                    {t('game.aiNormal') || 'Normal'}
                  </Button>
                  <Button 
                    onClick={() => handleSetAIDifficulty(AIDifficulty.MEDIUM)}
                    variant={aiDifficulty === AIDifficulty.MEDIUM ? 'default' : 'outline'}
                    size="sm"
                    className={aiDifficulty === AIDifficulty.MEDIUM ? 'bg-yellow-500 hover:bg-yellow-600' : 'hover:bg-yellow-50'}
                  >
                    {t('game.aiMedium')}
                  </Button>
                  <Button 
                    onClick={() => handleSetAIDifficulty(AIDifficulty.HARD)}
                    variant={aiDifficulty === AIDifficulty.HARD ? 'default' : 'outline'}
                    size="sm"
                    className={aiDifficulty === AIDifficulty.HARD ? 'bg-orange-500 hover:bg-orange-600' : 'hover:bg-orange-50'}
                  >
                    {t('game.aiHard')}
                  </Button>
                  <Button 
                    onClick={() => handleSetAIDifficulty(AIDifficulty.EXPERT)}
                    variant={aiDifficulty === AIDifficulty.EXPERT ? 'default' : 'outline'}
                    size="sm"
                    className={aiDifficulty === AIDifficulty.EXPERT ? 'bg-red-600 hover:bg-red-700' : 'hover:bg-red-50'}
                  >
                    {t('game.aiExpert') || 'Expert'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Players info */}
            <div className="flex flex-col gap-4">
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
          </div>

          {/* Right column - Game board */}
          <div className="lg:w-2/3">
            <GameBoard />
          </div>
        </div>
      </div>
    </div>
  );
}
