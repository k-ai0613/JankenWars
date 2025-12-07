import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../lib/stores/useLanguage';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { FaHome, FaGamepad, FaBook, FaInfoCircle, FaEnvelope } from 'react-icons/fa';

export function Header() {
  const { language, setLanguage } = useLanguage();
  const location = useLocation();
  const isJapanese = language === 'ja';

  const navItems = [
    { path: '/', labelEn: 'Home', labelJa: 'ホーム', icon: FaHome },
    { path: '/how-to-play', labelEn: 'How to Play', labelJa: '遊び方', icon: FaBook },
    { path: '/about', labelEn: 'About', labelJa: 'このゲームについて', icon: FaInfoCircle },
    { path: '/contact', labelEn: 'Contact', labelJa: 'お問い合わせ', icon: FaEnvelope },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link
            to="/"
            className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600"
          >
            JankenWars
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map(({ path, labelEn, labelJa, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${isActive(path)
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
              >
                <Icon size={14} />
                {isJapanese ? labelJa : labelEn}
              </Link>
            ))}
          </nav>

          {/* Language Toggle */}
          <div className="flex items-center space-x-2">
            <Label htmlFor="header-language-toggle" className="text-xs font-medium text-gray-600">
              EN
            </Label>
            <Switch
              id="header-language-toggle"
              checked={language === 'ja'}
              onCheckedChange={(checked) => setLanguage(checked ? 'ja' : 'en')}
              aria-label="Toggle language"
            />
            <Label htmlFor="header-language-toggle" className="text-xs font-medium text-gray-600">
              日本語
            </Label>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden flex items-center justify-center space-x-1 pb-2 overflow-x-auto">
          {navItems.map(({ path, labelEn, labelJa, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors
                ${isActive(path)
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100'
                }`}
            >
              <Icon size={12} />
              {isJapanese ? labelJa : labelEn}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default Header;
