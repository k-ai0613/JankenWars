import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// インタースティシャル広告コンポーネント
// ゲーム終了時やシーン切り替え時に表示される全画面広告

interface InterstitialAdProps {
  // 広告を表示するかどうか
  isVisible: boolean;
  // 広告を閉じたときのコールバック
  onClose: () => void;
  // 自動で閉じるまでの時間（秒）
  autoCloseSeconds?: number;
  // AdSense クライアントID
  adClient?: string;
  // AdSense 広告スロットID
  adSlot?: string;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export const InterstitialAd: React.FC<InterstitialAdProps> = ({
  isVisible,
  onClose,
  autoCloseSeconds = 5,
  adClient = import.meta.env.VITE_ADSENSE_CLIENT || '',
  adSlot = import.meta.env.VITE_ADSENSE_INTERSTITIAL_SLOT || '',
}) => {
  const [countdown, setCountdown] = useState(autoCloseSeconds);
  const [canClose, setCanClose] = useState(false);

  // カウントダウン処理
  useEffect(() => {
    if (!isVisible) {
      setCountdown(autoCloseSeconds);
      setCanClose(false);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanClose(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, autoCloseSeconds]);

  // 広告のロード
  useEffect(() => {
    if (!isVisible || !adClient || !adSlot) return;

    try {
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        window.adsbygoogle.push({});
      }
    } catch (error) {
      console.error('[InterstitialAd] Error loading ad:', error);
    }
  }, [isVisible, adClient, adSlot]);

  const handleClose = useCallback(() => {
    if (canClose) {
      onClose();
    }
  }, [canClose, onClose]);

  // ESCキーで閉じる
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && canClose) {
        handleClose();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, canClose, handleClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダー */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                スポンサー広告
              </span>
              <button
                onClick={handleClose}
                disabled={!canClose}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  canClose
                    ? 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                {canClose ? '閉じる' : `${countdown}秒後に閉じる`}
              </button>
            </div>

            {/* 広告コンテンツ */}
            <div className="p-4 min-h-[300px] flex items-center justify-center">
              {adClient && adSlot ? (
                <ins
                  className="adsbygoogle"
                  style={{ display: 'block', width: '100%', height: '280px' }}
                  data-ad-client={adClient}
                  data-ad-slot={adSlot}
                  data-ad-format="rectangle"
                />
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 p-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-lg font-medium mb-2">広告プレースホルダー</p>
                  <p className="text-sm">
                    本番環境では AdSense 広告が表示されます
                  </p>
                </div>
              )}
            </div>

            {/* フッター */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900 text-center">
              <p className="text-xs text-gray-400">
                広告をサポートいただきありがとうございます
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InterstitialAd;
