import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import OnlineStatusIndicator from './components/OnlineStatusIndicator';
import GamePage from './pages/GamePage';
import { OnlineGamePage } from './pages/OnlineGamePage';
import { Home } from './pages/home';
import NotFound from './pages/not-found';
import { TestPage } from './pages/TestPage';
import '@fontsource/inter';
import './index.css';

function App() {
  // クライアント側の状態管理
  const [serverConnected, setServerConnected] = useState<boolean | null>(null);
  const [isClient, setIsClient] = useState(false);

  // マウント時にクライアントサイドであることを確認
  useEffect(() => {
    setIsClient(true);
    
    // サーバー接続状態を確認
    const checkServerConnection = async () => {
      try {
        const response = await fetch('/api/health', { 
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          // キャッシュを無効化
          cache: 'no-store'
        });
        
        if (response.ok) {
          setServerConnected(true);
          console.log('サーバーに接続されています');
        } else {
          setServerConnected(false);
          console.warn('サーバー接続エラー:', response.status);
        }
      } catch (error) {
        setServerConnected(false);
        console.error('サーバー接続エラー:', error);
      }
    };

    // 初回チェック
    checkServerConnection();

    // 定期的にサーバー接続を確認（30秒ごと）
    const intervalId = setInterval(checkServerConnection, 30000);

    return () => clearInterval(intervalId);
  }, []);

  // クライアントサイドでない場合はローディング表示
  if (!isClient) {
    return <div className="p-4 text-center">アプリケーションを読み込み中...</div>;
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/online" element={<OnlineGamePage />} />
        <Route path="/test" element={<TestPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      <OnlineStatusIndicator />
      
      {/* サーバー接続状態表示 */}
      {serverConnected === false && (
        <div className="fixed top-2 right-2 px-3 py-1 bg-red-500 text-white rounded-full text-xs font-medium z-50">
          サーバーに接続できません
        </div>
      )}
    </>
  );
}

export default App;
