import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { useLanguage } from '../lib/stores/useLanguage';

export function Home() {
  const { language, setLanguage, t } = useLanguage();
  
  const handleToggleLanguage = () => {
    setLanguage(language === 'en' ? 'ja' : 'en');
  };

  return (
    <div className="container mx-auto p-4 min-h-screen flex flex-col items-center justify-center">
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

      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold mb-6 text-center">{t('home.title')}</h1>
        
        <p className="text-xl mb-8">
          {t('home.description')}
        </p>
        
        <div className="flex flex-col gap-4 items-center">
          <Link to="/game" className="w-full max-w-xs">
            <Button className="w-full py-6 text-xl" size="lg">
              {t('home.playLocal')}
            </Button>
          </Link>
          
          {/* These buttons will be implemented in future versions */}
          <Button className="w-full max-w-xs py-5" variant="outline" disabled>
            {t('home.playAI')}
          </Button>
          
          <Button className="w-full max-w-xs py-5" variant="outline" disabled>
            {t('home.playOnline')}
          </Button>
        </div>
        
        <div className="mt-12 p-6 bg-gray-50 rounded-lg border shadow-sm max-h-[500px] overflow-y-auto">
          <h2 className="text-2xl font-semibold mb-4">{t('home.rules')}</h2>
          
          <div className="text-left">
            <h3 className="font-bold text-lg mb-2">{t('home.objective')}</h3>
            <p className="mb-4">{t('home.objective.description')}</p>
            
            <h3 className="font-bold text-lg mb-2">{t('home.gameplay')}</h3>
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
            
            <h3 className="font-bold text-lg mb-2">{t('home.jankenRules')}</h3>
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
            
            <h3 className="font-bold text-lg mb-2">{t('home.specialPiece')}</h3>
            <p className="mb-4">
              {language === 'en' 
                ? 'Each player has one Special Piece that can only be placed on empty squares. It cannot be captured and cannot capture other pieces.'
                : '各プレイヤーは1つの特殊駒を持っています。特殊駒は空いているマスにのみ配置でき、捕獲されることも他の駒を捕獲することもできません。'
              }
            </p>
            
            <h3 className="font-bold text-lg mb-2">{t('home.drawCondition')}</h3>
            <p>
              {language === 'en'
                ? 'If the board fills up or both players run out of pieces without achieving 5 in a row, the game ends in a draw.'
                : 'ボードがいっぱいになるか、5つ並べることなく両プレイヤーが駒を使い切った場合、ゲームは引き分けとなります。'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
