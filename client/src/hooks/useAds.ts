import { useState, useCallback, useEffect } from 'react';

// 広告表示の頻度管理
const AD_FREQUENCY = {
  // インタースティシャル広告を表示する間隔（ゲーム数）
  INTERSTITIAL_INTERVAL: 3,
  // 最後に広告を表示した時刻を保存するキー
  LAST_AD_KEY: 'janken_last_ad_time',
  // 広告表示の最小間隔（ミリ秒）
  MIN_AD_INTERVAL: 60000, // 1分
};

interface UseAdsReturn {
  // インタースティシャル広告の表示状態
  showInterstitial: boolean;
  // インタースティシャル広告を表示
  triggerInterstitial: () => void;
  // インタースティシャル広告を閉じる
  closeInterstitial: () => void;
  // ゲーム終了時に呼び出す（広告表示判定）
  onGameEnd: () => void;
  // 広告が設定されているかどうか
  isAdsConfigured: boolean;
}

export const useAds = (): UseAdsReturn => {
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [gameCount, setGameCount] = useState(0);

  // AdSense が設定されているか確認
  const isAdsConfigured = Boolean(
    import.meta.env.VITE_ADSENSE_CLIENT &&
    import.meta.env.VITE_ADSENSE_SLOT
  );

  // 最後の広告表示からの経過時間を確認
  const canShowAd = useCallback((): boolean => {
    const lastAdTime = localStorage.getItem(AD_FREQUENCY.LAST_AD_KEY);
    if (!lastAdTime) return true;

    const elapsed = Date.now() - parseInt(lastAdTime, 10);
    return elapsed >= AD_FREQUENCY.MIN_AD_INTERVAL;
  }, []);

  // 広告表示時刻を記録
  const recordAdShown = useCallback(() => {
    localStorage.setItem(AD_FREQUENCY.LAST_AD_KEY, Date.now().toString());
  }, []);

  // インタースティシャル広告を表示
  const triggerInterstitial = useCallback(() => {
    if (!canShowAd()) {
      console.log('[useAds] Ad shown too recently, skipping');
      return;
    }
    setShowInterstitial(true);
    recordAdShown();
  }, [canShowAd, recordAdShown]);

  // インタースティシャル広告を閉じる
  const closeInterstitial = useCallback(() => {
    setShowInterstitial(false);
  }, []);

  // ゲーム終了時の処理
  const onGameEnd = useCallback(() => {
    setGameCount((prev) => {
      const newCount = prev + 1;
      // 一定回数ごとに広告を表示
      if (newCount >= AD_FREQUENCY.INTERSTITIAL_INTERVAL) {
        setTimeout(() => {
          triggerInterstitial();
        }, 1500); // 結果表示後に少し遅延
        return 0; // カウントリセット
      }
      return newCount;
    });
  }, [triggerInterstitial]);

  // コンポーネントマウント時にゲームカウントを復元
  useEffect(() => {
    const savedCount = sessionStorage.getItem('janken_game_count');
    if (savedCount) {
      setGameCount(parseInt(savedCount, 10));
    }
  }, []);

  // ゲームカウントを保存
  useEffect(() => {
    sessionStorage.setItem('janken_game_count', gameCount.toString());
  }, [gameCount]);

  return {
    showInterstitial,
    triggerInterstitial,
    closeInterstitial,
    onGameEnd,
    isAdsConfigured,
  };
};

export default useAds;
