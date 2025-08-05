import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import "./index.css";

// ブラウザ環境かどうかをチェック
const isBrowser = typeof window !== 'undefined';

// DOMが完全に読み込まれてからレンダリングを開始
if (isBrowser) {
  const rootElement = document.getElementById("root");
  if (rootElement) {
    // Strictモードを使わないようにして、不要な再レンダリングを防止
    ReactDOM.createRoot(rootElement).render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
);
  } else {
    console.error("Root element not found, cannot render React application");
  }

  // サービスワーカーの処理
if ('serviceWorker' in navigator) {
    console.log('[DEBUG] Unregistering all service workers...');
    
    // 既存のサービスワーカーを登録解除
    navigator.serviceWorker.getRegistrations().then(registrations => {
      console.log(`[DEBUG] Found ${registrations.length} service worker registrations`);
      
      for(let registration of registrations) {
        registration.unregister().then(success => {
          console.log('[DEBUG] ServiceWorker unregistered:', success);
        }).catch(err => {
          console.error('[DEBUG] ServiceWorker unregister failed:', err);
        });
      }
      
      // キャッシュもクリア
      if ('caches' in window) {
        caches.keys().then(cacheNames => {
          console.log(`[DEBUG] Found ${cacheNames.length} caches to clear`);
          return Promise.all(
            cacheNames.map(cacheName => {
              console.log(`[DEBUG] Deleting cache: ${cacheName}`);
              return caches.delete(cacheName);
            })
          );
        }).then(() => {
          console.log('[DEBUG] All caches cleared');
          
          // 開発環境でのみ: ページのハードリロードを促す
          if (process.env.NODE_ENV === 'development') {
            const shouldReload = sessionStorage.getItem('cache_cleared');
            if (!shouldReload) {
              console.log('[DEBUG] First time clearing cache in this session. Marking for reload.');
              sessionStorage.setItem('cache_cleared', 'true');
              // 自動リロードはしない（無限ループを避けるため）
            }
          }
        }).catch(err => {
          console.error('[DEBUG] Cache clearing failed:', err);
        });
      }
      
      // 開発モードでは完全に無効化
      if (process.env.NODE_ENV === 'development') {
        console.log('[DEBUG] Service workers are disabled in development mode');
      } else {
        // 本番環境でのみ再登録
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/service-worker.js')
            .then((registration) => {
              console.log('[DEBUG] Service Worker registered successfully:', registration.scope);
            })
            .catch((error) => {
              console.log('[DEBUG] Service Worker registration failed:', error);
            });
        });
      }
    }).catch(err => {
      console.error('[DEBUG] Failed to get service worker registrations:', err);
    });
  } else {
    console.log('[DEBUG] Service workers are not supported in this browser');
  }
} else {
  console.log('Server-side rendering - skipping DOM operations');
}
