'use client';

import React from 'react';

// クライアントサイドのみで実行されるラッパーコンポーネント
function OnlineStatusIndicator() {
  // サーバーサイドレンダリング時は何も表示しない
  if (typeof window === 'undefined') return null;
  
  return <ClientOnlyStatusIndicator />;
}

// クライアントサイドでのみ実行される内部コンポーネント
function ClientOnlyStatusIndicator() {
  // クライアント側での初期化
  const [isOnline, setIsOnline] = React.useState<boolean>(true);
  const [isUsingServiceWorker, setIsUsingServiceWorker] = React.useState<boolean>(false);

  React.useEffect(() => {
    // 現在のオンライン状態を設定
    setIsOnline(navigator.onLine);

    // イベントリスナーを設定
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // サービスワーカーの確認
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      setIsUsingServiceWorker(true);
    }

    // クリーンアップ関数
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // サービスワーカーが使用されていない場合は何も表示しない
  if (!isUsingServiceWorker) return null;

  return (
    <div className={`fixed bottom-2 right-2 px-3 py-1 rounded-full text-xs font-medium z-50 text-white ${
      isOnline ? 'bg-green-400/90' : 'bg-red-400/90'
    }`}>
      {isOnline ? '🟢 オンライン' : '🔴 オフライン（キャッシュ使用中）'}
    </div>
  );
}

export default OnlineStatusIndicator; 