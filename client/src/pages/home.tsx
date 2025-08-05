import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { useJankenGame } from '../lib/stores/useJankenGame';
import { AIDifficulty } from '../lib/aiUtils';
import { motion } from 'framer-motion';
import { FaHandRock, FaHandPaper, FaHandScissors, FaStar, FaBrain } from 'react-icons/fa';
import { useLanguage } from '../lib/stores/useLanguage';
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";

// AI難易度ボタンのスタイルを統一するためのヘルパー
const difficultyButtonVariants = {
  default: "border border-input bg-background shadow-sm hover:text-accent-foreground",
  selected: "bg-yellow-500 hover:bg-yellow-600 text-primary-foreground",
  beginner: "hover:bg-blue-50",
  normal: "hover:bg-green-50",
  hard: "hover:bg-cyan-50",
  expert: "", // EXPERTは選択時スタイルがデフォルト
};

// ローカルのenum定義を削除し、importしたAIDifficultyを使用
const difficultyMap: { level: AIDifficulty, labelKey: string, styleKey: keyof typeof difficultyButtonVariants, iconColor?: string }[] = [
  { level: AIDifficulty.BEGINNER, labelKey: 'difficulty.beginner', styleKey: 'beginner', iconColor: 'text-gray-500' },
  { level: AIDifficulty.EASY, labelKey: 'difficulty.easy', styleKey: 'beginner', iconColor: 'text-blue-500' },
  { level: AIDifficulty.NORMAL, labelKey: 'difficulty.normal', styleKey: 'normal', iconColor: 'text-green-500' },
  { level: AIDifficulty.MEDIUM, labelKey: 'difficulty.medium', styleKey: 'normal', iconColor: 'text-teal-500' },
  { level: AIDifficulty.HARD, labelKey: 'difficulty.hard', styleKey: 'hard', iconColor: 'text-cyan-500' },
  { level: AIDifficulty.EXPERT, labelKey: 'difficulty.expert', styleKey: 'expert', iconColor: 'text-yellow-600' },
];

// 言語タイプを定義
type LanguageType = 'en' | 'ja';

export function Home() {
  // useLanguageフックを使用
  const { t, language, setLanguage } = useLanguage();

  // useJankenGame 関連のコメントを解除
  const initialAIDifficulty = useJankenGame(state => state.initialAIDifficulty);
  const setInitialAIDifficulty = useJankenGame(state => state.setInitialAIDifficulty);
  const isAIEnabled = useJankenGame(state => state.isAIEnabled);
  const setIsAIEnabled = useJankenGame(state => state.setIsAIEnabled);
  const setAIDifficulty = useJankenGame(state => state.setAIDifficulty);
  const resetGame = useJankenGame(state => state.resetGame);

  // handleSetAIDifficulty もコメント解除
  const handleSetAIDifficulty = (difficulty: AIDifficulty) => {
    console.log(`[Home] AI難易度を設定: ${difficulty}`);
    setInitialAIDifficulty(difficulty);
  };
  
  // ゲームモードをセットしてからゲームをリセット
  const prepareLocalGame = () => {
    console.log('[Home] ローカルゲームモードの準備を開始します');
    
    // AIモードを確実に無効化
    setIsAIEnabled(false);
    
    // ローカルストレージの関連キーを完全に削除
    localStorage.removeItem('janken-game-storage');
    localStorage.removeItem('ai_mode');
    
    // persistを使用しているZustandストアのクリア対策として
    // 少し遅延させてからクリア操作を追加で実行
    setTimeout(() => {
      localStorage.removeItem('janken-game-storage');
      
      // 確実にAIモードを無効にするためのバックアップ処理
      try {
        const gameState = useJankenGame.getState();
        if (gameState.isAIEnabled) {
          console.log('[Home] バックアッププロセスでAIモードを無効化します');
          gameState.setIsAIEnabled(false);
        }
      } catch (err) {
        console.error('[Home] AIモード無効化のバックアッププロセスでエラー:', err);
      }
    }, 50);
    
    // 二重にリセット処理を行う
    resetGame();
    // 遅延をつけて2回目のリセットを呼び出し
    setTimeout(() => {
      resetGame();
    }, 100);
    
    console.log('[Home] ローカルゲームモードを準備: AIモード無効化完了');
  };
  
  // AIゲーム用の準備
  const prepareAIGame = () => {
    console.log('[Home] AIゲームモードの準備を開始します');
    
    // ローカルストレージをクリア（キーを明示的に指定）
    localStorage.removeItem('janken-game-storage');
    localStorage.removeItem('ai_mode');
    
    // AIモードを確実に有効化
    setIsAIEnabled(true);
    
    // persistを使用しているZustandストアのクリア対策として
    // 少し遅延させてからクリア操作を追加で実行
    setTimeout(() => {
      localStorage.removeItem('janken-game-storage');
      
      // AIモードをオンにしてローカルストレージに保存
      // GamePageでの読み取り用にai_modeをセット
      localStorage.setItem('ai_mode', 'true');
      
      // 確実にAIモードを有効にするためのバックアップ処理
      try {
        const gameState = useJankenGame.getState();
        if (!gameState.isAIEnabled) {
          console.log('[Home] バックアッププロセスでAIモードを有効化します');
          gameState.setIsAIEnabled(true);
        }
      } catch (err) {
        console.error('[Home] AIモード有効化のバックアッププロセスでエラー:', err);
      }
    }, 50);
    
    // 難易度を設定
    setAIDifficulty(initialAIDifficulty);
    
    // 二重にリセット処理を行う
    resetGame();
    // 遅延をつけて2回目のリセットを呼び出し
    setTimeout(() => {
      resetGame();
    }, 100);
    
    console.log(`[Home] AIゲームモードを準備: 難易度=${initialAIDifficulty}`);
  };

  // 言語に基づいて表示するコンテンツを切り替える関数
  const getLanguageContent = (enContent: React.ReactNode, jaContent: React.ReactNode) => {
    // 型アサーションを使用して型エラーを解消
    return (language === 'en' as LanguageType) ? enContent : jaContent;
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
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
      <div className="container mx-auto p-6 flex flex-col items-center relative z-10 pb-20">
        {/* 言語切り替えスイッチ */}
        <div className="absolute top-5 right-5 flex items-center space-x-2 bg-white/80 px-3 py-1.5 rounded-md border border-gray-300 shadow-sm">
          <Label htmlFor="home-language-toggle" className="text-sm font-medium text-gray-700">
            English
          </Label>
          <Switch
            id="home-language-toggle"
            checked={language === 'ja'}
            onCheckedChange={(checked) => setLanguage(checked ? 'ja' : 'en')}
            aria-label="Toggle language"
          />
          <Label htmlFor="home-language-toggle" className="text-sm font-medium text-gray-700">
            日本語
          </Label>
        </div>

        <div className="max-w-2xl mx-auto text-center mt-20">
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
                onClick={prepareLocalGame}
              >
                {getLanguageContent("Local 2-Player Game", "ローカル2プレイヤー対戦")}
              </Button>
            </Link>
            
            {/* AI Mode */}
            <div className="w-full max-w-xs flex flex-col gap-3 items-center p-4 bg-white/70 backdrop-blur-sm rounded-lg shadow-md border border-slate-200">
              <Link to="/game" className="w-full">
                <Button
                  className="w-full py-5 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 shadow-lg shadow-green-500/20 hover:shadow-green-600/30 transition-all duration-300 text-white text-lg"
                  onClick={prepareAIGame}
                >
                  <FaBrain className="mr-2" /> {getLanguageContent("Play against AI", "AIと対戦する")}
                </Button>
              </Link>
              
              <div className="w-full">
                <p className="text-sm font-medium mb-2 text-slate-700">{getLanguageContent("AI Difficulty", "AI難易度")}:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {difficultyMap.map(({ level, labelKey, styleKey }) => (
                    <Button
                      key={level}
                      onClick={() => handleSetAIDifficulty(level)}
                      variant="outline"
                      size="sm"
                      className={`w-full text-xs transition-all duration-200
                        ${initialAIDifficulty === level ? difficultyButtonVariants.selected : difficultyButtonVariants.default}
                        ${initialAIDifficulty !== level ? difficultyButtonVariants[styleKey] : ''}
                      `}
                    >
                      {t(labelKey)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="w-full max-w-sm text-center mt-2 text-sm text-gray-600 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm">
              <p>
                {getLanguageContent(
                  "Select an AI difficulty above before starting an AI match.",
                  "AIと対戦する前に、上記のAI難易度を選択してください。"
                )}
              </p>
            </div>
            
            <Link to="/online" className="w-full max-w-xs">
              <Button 
                className="w-full py-5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/20 hover:shadow-purple-600/30 transition-all duration-300 text-white"
              >
                {t('home.playOnline')}
              </Button>
            </Link>
          </motion.div>
          
          <motion.div 
            className="mt-8 mb-20 p-6 bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h2 className="text-2xl font-bold mb-4 text-indigo-700">{t('home.rules')}</h2>
            
            <div className="text-left text-slate-700 pr-2 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
              <h3 className="font-bold text-lg mb-2 text-indigo-600">{t('home.objective')}</h3>
              <p className="mb-4">{t('home.objective.description')}</p>
              
              <h3 className="font-bold text-lg mb-2 text-indigo-600">{t('home.gameplay')}</h3>
              <ul className="list-disc pl-5 space-y-2 mb-4">
                {getLanguageContent(
                  <>
                    <li>Players take turns placing pieces on the board.</li>
                    <li>On your turn, you'll receive a random piece (Rock, Paper, or Scissors).</li>
                    <li>Place your piece on an empty square OR capture an opponent's piece using Janken (Rock-Paper-Scissors) rules.</li>
                    <li>Squares used in a Janken battle become locked and cannot be used again.</li>
                    <li>You cannot move your pieces once placed.</li>
                  </>,
                  <>
                    <li>あなたの番になると、ランダムな駒（グー、パー、またはチョキ）を受け取ります。</li>
                    <li>空いているマスに自分の駒を置くか、じゃんけんルールを使って相手の駒を取り替えます。</li>
                    <li>使いたいマスに既に相手の駒がある場合、じゃんけん勝負になります。</li>
                    <li>一度じゃんけん勝負が行われたマスは、再び使うことができません。</li>
                    <li>一度配置した駒を動かすことはできません。</li>
                  </>
                )}
              </ul>
              
              <h3 className="font-bold text-lg mb-2 text-indigo-600">{t('home.jankenRules')}</h3>
              <ul className="list-disc pl-5 space-y-1 mb-4">
                {getLanguageContent(
                  <>
                    <li>Rock beats Scissors</li>
                    <li>Scissors beats Paper</li>
                    <li>Paper beats Rock</li>
                    <li>When you win: Remove opponent's piece and place yours</li>
                    <li>When you lose: Your piece cannot be placed there</li>
                  </>,
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
              <div className="mb-4">
                {getLanguageContent(
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Each player has one Special Piece that can only be placed on empty squares.</li>
                    <li>It cannot be captured and cannot capture other pieces.</li>
                    <li>Use it strategically to block important positions on the board.</li>
                  </ul>,
                  <ul className="list-disc pl-5 space-y-1">
                    <li>各プレイヤーは、特殊駒を1つ持っています。</li>
                    <li>特殊駒は空いているマスにのみ配置できます。</li>
                    <li>特殊駒は、相手に取られることも、相手の駒を取ることもできません。</li>
                    <li>盤上の重要な位置を確保するために戦略的に使いましょう。</li>
                  </ul>
                )}
              </div>
              
              <h3 className="font-bold text-lg mb-2 text-indigo-600">{t('home.drawCondition')}</h3>
              <div>
                {getLanguageContent(
                  <ul className="list-disc pl-5 space-y-1">
                    <li>If the board fills up without any winner, the game ends in a draw.</li>
                    <li>If both players run out of pieces without achieving 5 in a row, the game ends in a draw.</li>
                  </ul>,
                  <ul className="list-disc pl-5 space-y-1">
                    <li>ボードがいっぱいになり、勝者がいない場合、ゲームは引き分けとなります。</li>
                    <li>5つ並べることなく両プレイヤーが駒を使い切った場合、ゲームは引き分けとなります。</li>
                  </ul>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
