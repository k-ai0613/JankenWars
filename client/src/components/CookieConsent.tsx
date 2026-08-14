import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../lib/stores/useLanguage';

const COOKIE_CONSENT_KEY = 'jankenwars-cookie-consent';

export type ConsentStatus = 'accepted' | 'declined' | null;

export function getConsentStatus(): ConsentStatus {
  const value = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (value === 'accepted' || value === 'declined') return value;
  return null;
}

export function loadAdSenseScript() {
  if (document.getElementById('adsense-script')) return;
  // AdBanner/InterstitialAdと同じ環境変数を参照し、クライアントIDの二重管理を避ける
  const adClient = import.meta.env.VITE_ADSENSE_CLIENT || 'ca-pub-4697036546722306';
  const script = document.createElement('script');
  script.id = 'adsense-script';
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`;
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);
}

export function CookieConsent() {
  const { language } = useLanguage();
  const isJapanese = language === 'ja';
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const status = getConsentStatus();
    if (status === null) {
      setVisible(true);
    } else if (status === 'accepted') {
      loadAdSenseScript();
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setVisible(false);
    loadAdSenseScript();
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-white border-t border-gray-300 shadow-lg px-4 py-4 md:px-8">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <p className="text-sm text-gray-700 flex-1">
          {isJapanese
            ? '当サイトでは、広告配信やアクセス解析のためにCookieを使用しています。詳しくは'
            : 'This site uses cookies for advertising and analytics. See our '}
          <Link to="/privacy" className="text-indigo-600 underline hover:text-indigo-800">
            {isJapanese ? 'プライバシーポリシー' : 'Privacy Policy'}
          </Link>
          {isJapanese ? 'をご確認ください。' : ' for details.'}
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleDecline}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {isJapanese ? '拒否' : 'Decline'}
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            {isJapanese ? '同意する' : 'Accept'}
          </button>
        </div>
      </div>
    </div>
  );
}
