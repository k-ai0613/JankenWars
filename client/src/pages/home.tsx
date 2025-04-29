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
      <div className="self-end flex items-center space-x-2 mb-4">
        <span className="text-sm">EN</span>
        <Switch 
          checked={language === 'ja'}
          onCheckedChange={handleToggleLanguage}
        />
        <span className="text-sm">日本語</span>
      </div>

      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold mb-6 text-center">{t('home.title')}</h1>
        
        <p className="text-xl mb-8">
          {t('home.description')}
        </p>
        
        <div className="flex flex-col gap-4 items-center">
          <Link to="/game" className="w-full max-w-xs">
            <Button className="w-full py-6 text-xl" size="lg">
              Play Local Game
            </Button>
          </Link>
          
          {/* These buttons will be implemented in future versions */}
          <Button className="w-full max-w-xs py-5" variant="outline" disabled>
            Play vs AI (Coming Soon)
          </Button>
          
          <Button className="w-full max-w-xs py-5" variant="outline" disabled>
            Online Multiplayer (Coming Soon)
          </Button>
        </div>
        
        <div className="mt-12 p-6 bg-gray-50 rounded-lg border shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">Game Rules</h2>
          
          <div className="text-left">
            <h3 className="font-bold text-lg mb-2">Objective</h3>
            <p className="mb-4">Be the first to place 5 of your pieces in a row (horizontally, vertically, or diagonally) on the 6x6 grid.</p>
            
            <h3 className="font-bold text-lg mb-2">Gameplay</h3>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li>Players take turns placing pieces on the board.</li>
              <li>On your turn, you'll receive a random piece (Rock, Paper, or Scissors).</li>
              <li>Place your piece on an empty square OR capture an opponent's piece using Janken (Rock-Paper-Scissors) rules.</li>
              <li>You cannot move your pieces once placed.</li>
            </ul>
            
            <h3 className="font-bold text-lg mb-2">Janken Rules</h3>
            <ul className="list-disc pl-5 space-y-1 mb-4">
              <li>Rock beats Scissors</li>
              <li>Scissors beats Paper</li>
              <li>Paper beats Rock</li>
              <li>When you win: Remove opponent's piece and place yours</li>
              <li>When you lose: Your piece cannot be placed there</li>
            </ul>
            
            <h3 className="font-bold text-lg mb-2">Special Piece</h3>
            <p className="mb-4">Each player has one Special Piece that can only be placed on empty squares. It cannot be captured and cannot capture other pieces.</p>
            
            <h3 className="font-bold text-lg mb-2">Draw Condition</h3>
            <p>If the board fills up or both players run out of pieces without achieving 5 in a row, the game ends in a draw.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
