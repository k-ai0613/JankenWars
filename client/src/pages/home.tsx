import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { useLanguage } from '../lib/stores/useLanguage';
import { useJankenGame } from '../lib/stores/useJankenGame';
import { AIDifficulty } from '../lib/aiUtils';
import { motion } from 'framer-motion';
import { FaHandRock, FaHandPaper, FaHandScissors, FaStar } from 'react-icons/fa';

export function Home() {
  const { language, setLanguage, t } = useLanguage();
  
  const handleToggleLanguage = () => {
    setLanguage(language === 'en' ? 'ja' : 'en');
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-indigo-200 to-transparent opacity-40"></div>
      <div className="absolute bottom-0 right-0 w-full h-64 bg-gradient-to-t from-pink-200 to-transparent opacity-30"></div>
      <div className="absolute top-1/4 left-1/3 w-64 h-64 rounded-full bg-yellow-200 opacity-10 blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 rounded-full bg-blue-200 opacity-10 blur-3xl"></div>
      
      {/* Floating decorative game pieces */}
      <motion.div 
        className="absolute top-20 left-[15%] text-blue-500 opacity-40"
        animate={{ y: [0, 15, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <FaHandRock size={40} />
      </motion.div>
      <motion.div 
        className="absolute top-[30%] right-[10%] text-red-500 opacity-40"
        animate={{ y: [0, -20, 0], rotate: [0, -10, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      >
        <FaHandPaper size={50} />
      </motion.div>
      <motion.div 
        className="absolute bottom-[25%] left-[10%] text-blue-500 opacity-40"
        animate={{ y: [0, 10, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <FaHandScissors size={45} />
      </motion.div>
      <motion.div 
        className="absolute bottom-[15%] right-[20%] text-red-500 opacity-40"
        animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        <FaHandScissors size={35} />
      </motion.div>
      <motion.div 
        className="absolute top-[40%] left-[5%] text-yellow-500 opacity-40"
        animate={{ y: [0, 20, 0], scale: [1, 1.1, 1], rotate: [0, 180, 360] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      >
        <FaStar size={30} />
      </motion.div>
      
      {/* Main content container */}
      <div className="container mx-auto p-6 min-h-screen flex flex-col items-center justify-center relative z-10">
        {/* Language toggle */}
        <div className="self-end flex items-center space-x-3 mb-4 bg-white/80 backdrop-blur-sm p-3 rounded-lg shadow-md border border-slate-200">
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

        <div className="max-w-2xl mx-auto text-center">
          {/* Title with shadow effect */}
          <motion.h1 
            className="text-5xl md:text-6xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 drop-shadow-md"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {t('home.title')}
          </motion.h1>
          
          <motion.p 
            className="text-xl mb-8 text-slate-700"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {t('home.description')}
          </motion.p>
          
          <motion.div 
            className="flex flex-col gap-4 items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link to="/game" className="w-full max-w-xs">
              <Button 
                className="w-full py-6 text-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/20 hover:shadow-blue-600/30 transition-all duration-300" 
                size="lg"
                onClick={() => {
                  // Make sure AI mode is disabled for local play
                  localStorage.removeItem('ai_mode');
                }}
              >
                {t('home.playLocal')}
              </Button>
            </Link>
            
            {/* AI Mode */}
            <Link to="/game" className="w-full max-w-xs">
              <Button 
                className="w-full py-5 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 shadow-lg shadow-green-500/20 hover:shadow-green-600/30 transition-all duration-300 text-white"
                onClick={() => {
                  // Reset game state for AI play
                  localStorage.setItem('ai_mode', 'true');
                }}
              >
                {t('home.playAI')}
              </Button>
            </Link>
            
            <div className="w-full max-w-xs text-center mt-2 text-sm text-gray-600 bg-white/70 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm">
              <p>
                {language === 'en' 
                  ? "You can also switch between Player vs Player and AI modes during the game using the AI toggle."
                  : "ゲーム中でもAIトグルを使ってプレイヤー対戦とAIモードを切り替えることができます。"}
              </p>
            </div>
            
            <Button className="w-full max-w-xs py-5 bg-white/80 backdrop-blur-sm text-slate-700 hover:bg-white/90" variant="outline" disabled>
              {t('home.playOnline')}
            </Button>
          </motion.div>
          
          <motion.div 
            className="mt-12 p-6 bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg max-h-[500px] overflow-y-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h2 className="text-2xl font-bold mb-4 text-indigo-700">{t('home.rules')}</h2>
            
            <div className="text-left text-slate-700">
              <h3 className="font-bold text-lg mb-2 text-indigo-600">{t('home.objective')}</h3>
              <p className="mb-4">{t('home.objective.description')}</p>
              
              <h3 className="font-bold text-lg mb-2 text-indigo-600">{t('home.gameplay')}</h3>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                {language === 'en' ? (
                  <>
                    <li>Players take turns placing pieces on the board.</li>
                    <li>On your turn, you'll receive a random piece (Rock, Paper, or Scissors).</li>
                    <li>Place your piece on an empty square OR capture an opponent's piece using Janken (Rock-Paper-Scissors) rules.</li>
                    <li>You cannot move your pieces once placed.</li>
                  </>
                ) : (
                  <>
                    <li>プレイヤーは交代でボードに駒を配置します。</li>
                    <li>あなたの番になると、ランダムに一つ（グー、パー、またはチョキ）を受け取ります。</li>
                    <li>空いているマスに自分の駒を置くか、じゃんけんルールを使って相手の駒を取り替えます。</li>
                    <li>一度配置した駒を動かすことはできません。</li>
                  </>
                )}
              </ul>
              
              <h3 className="font-bold text-lg mb-2 text-indigo-600">{t('home.jankenRules')}</h3>
              <ul className="list-disc pl-5 space-y-1 mb-4">
                {language === 'en' ? (
                  <>
                    <li>Rock beats Scissors</li>
                    <li>Scissors beats Paper</li>
                    <li>Paper beats Rock</li>
                    <li>When you win: Remove opponent's piece and place yours</li>
                    <li>When you lose: Your piece cannot be placed there</li>
                  </>
                ) : (
                  <>
                    <li>グーはチョキに勝つ</li>
                    <li>チョキはパーに勝つ</li>
                    <li>パーはグーに勝つ</li>
                    <li>勝った場合：相手の駒を取り除き、自分の駒を置く</li>
                    <li>負けた場合：その場所に駒を置くことはできません</li>
                  </>
                )}
              </ul>
              
              <h3 className="font-bold text-lg mb-2 text-indigo-600">{t('home.specialPiece')}</h3>
              <p className="mb-4">
                {language === 'en' 
                  ? 'Each player has one Special Piece that can only be placed on empty squares. It cannot be captured and cannot capture other pieces.'
                  : '各プレイヤーは1つの特殊駒を持っています。特殊駒は空いているマスにのみ配置でき、捕獲されることも他の駒を捕獲することもできません。'
                }
              </p>
              
              <h3 className="font-bold text-lg mb-2 text-indigo-600">{t('home.drawCondition')}</h3>
              <p>
                {language === 'en'
                  ? 'If the board fills up or both players run out of pieces without achieving 5 in a row, the game ends in a draw.'
                  : 'ボードがいっぱいになるか、5つ並べることなく両プレイヤーが駒を使い切った場合、ゲームは引き分けとなります。'
                }
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
