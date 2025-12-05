import React, { useEffect, useRef } from 'react';

// Google AdSense 広告バナーコンポーネント
// 使用前に index.html に AdSense スクリプトを追加してください

interface AdBannerProps {
  // AdSense 広告ユニットID（pub-XXXXXXXXXXXXXXXX形式）
  adClient?: string;
  // 広告スロットID
  adSlot?: string;
  // 広告フォーマット: 'auto', 'horizontal', 'vertical', 'rectangle'
  adFormat?: 'auto' | 'horizontal' | 'vertical' | 'rectangle';
  // レスポンシブ広告かどうか
  fullWidthResponsive?: boolean;
  // 広告の位置: 'top', 'bottom', 'sidebar'
  position?: 'top' | 'bottom' | 'sidebar';
  // カスタムクラス
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export const AdBanner: React.FC<AdBannerProps> = ({
  adClient = import.meta.env.VITE_ADSENSE_CLIENT || '',
  adSlot = import.meta.env.VITE_ADSENSE_SLOT || '',
  adFormat = 'auto',
  fullWidthResponsive = true,
  position = 'bottom',
  className = '',
}) => {
  const adRef = useRef<HTMLModElement>(null);
  const isAdLoaded = useRef(false);

  useEffect(() => {
    // 開発環境または AdSense 設定がない場合はスキップ
    if (!adClient || !adSlot) {
      console.log('[AdBanner] AdSense credentials not configured. Showing placeholder.');
      return;
    }

    // 既に広告がロードされている場合はスキップ
    if (isAdLoaded.current) {
      return;
    }

    try {
      // AdSense スクリプトがロードされているか確認
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        window.adsbygoogle.push({});
        isAdLoaded.current = true;
      }
    } catch (error) {
      console.error('[AdBanner] Error loading ad:', error);
    }

    return () => {
      isAdLoaded.current = false;
    };
  }, [adClient, adSlot]);

  // 位置に応じたスタイル
  const positionStyles: Record<string, string> = {
    top: 'w-full min-h-[90px] mb-4',
    bottom: 'w-full min-h-[90px] mt-4',
    sidebar: 'w-full min-h-[250px]',
  };

  // AdSense が設定されていない場合はプレースホルダーを表示
  if (!adClient || !adSlot) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg ${positionStyles[position]} ${className}`}
      >
        <div className="text-center text-gray-500 dark:text-gray-400 p-4">
          <p className="text-sm font-medium">広告スペース</p>
          <p className="text-xs mt-1">
            AdSense を設定するには環境変数を設定してください
          </p>
          <p className="text-xs mt-1 font-mono">
            VITE_ADSENSE_CLIENT, VITE_ADSENSE_SLOT
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`ad-container ${positionStyles[position]} ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
      />
    </div>
  );
};

export default AdBanner;
