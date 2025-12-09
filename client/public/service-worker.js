// Service Workerファイル
// PWAとしてオフライン機能を提供するためのもの

// キャッシュの名前とバージョンを明確に
const CACHE_NAME = 'jankenWars-cache-v2';
const APP_VERSION = '1.0.1'; // バージョン情報を追加

// キャッシュするリソース
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/favicon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // ゲーム関連のリソースも追加
  '/game',
  '/online'
];

// オフラインモード検出用のフラグ
let isOffline = false;

// オンライン/オフライン状態の変化を検出
self.addEventListener('online', () => {
  isOffline = false;
  console.log('オンラインに戻りました。サーバーに接続します。');
  // クライアントに通知
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'ONLINE_STATUS_CHANGE',
        online: true
      });
    });
  });
});

self.addEventListener('offline', () => {
  isOffline = true;
  console.log('オフラインモードに切り替わりました。キャッシュから提供します。');
  // クライアントに通知
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'ONLINE_STATUS_CHANGE',
        online: false
      });
    });
  });
});

// インストール時にキャッシュを作成
self.addEventListener('install', (event) => {
  console.log(`Service Worker (${APP_VERSION}) をインストールしています...`);
  // イベントが終了するまで待機
  event.waitUntil(
    // キャッシュを開く
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('キャッシュを開きました');
        // 指定したリソースをキャッシュに追加
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log(`Service Worker (${APP_VERSION}) のインストールが完了しました`);
        // 即時アクティベーション（古いバージョンを待たない）
        return self.skipWaiting();
      })
  );
});

// ネットワークリクエストをインターセプト
self.addEventListener('fetch', (event) => {
  // API呼び出しとWebSocketはキャッシュから除外
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('/socket.io/')) {
    // APIリクエストはネットワークのみ使用し、失敗したらオフラインメッセージを表示
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // エラーレスポンスの場合も正常に処理
          if (!response.ok) {
            console.log(`API responded with status: ${response.status}`);
          }
          return response;
        })
        .catch(error => {
          console.error('APIリクエストに失敗しました:', error);
          
          // api/healthエンドポイントの場合はダミーレスポンスを返す
          if (event.request.url.includes('/api/health')) {
            return new Response(JSON.stringify({
              status: 'offline',
              version: APP_VERSION,
              message: 'オフラインモード：ヘルスチェックはバイパスされました'
            }), {
              headers: { 'Content-Type': 'application/json' },
              status: 200
            });
          }
          
          // その他のAPIエンドポイントの場合はエラーレスポンスを返す
          return new Response(JSON.stringify({
            error: true,
            message: 'オフラインモードです。サーバーに接続できません。'
          }), {
            headers: { 'Content-Type': 'application/json' },
            status: 503 // Service Unavailable
          });
        })
    );
    return;
  }

  event.respondWith(
    // キャッシュを検索
    caches.match(event.request)
      .then((response) => {
        // キャッシュが見つかった場合はそれを返す
        if (response) {
          return response;
        }
        
        // キャッシュが見つからない場合はネットワークからフェッチ
        return fetch(event.request)
          .then(response => {
            // レスポンスが正常でない場合はそのまま返す
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // レスポンスをクローンしてキャッシュに保存
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(error => {
            console.error('フェッチに失敗しました:', error);
            // ナビゲーション（HTMLページ）リクエストの場合
            if (event.request.mode === 'navigate') {
              // オフラインページや代替コンテンツを提供
              return caches.match('/index.html')
                .then(response => {
                  return response || new Response(
                    'オフラインです。ネットワーク接続を確認してください。',
                    { headers: { 'Content-Type': 'text/html' } }
                  );
                });
            }
            // その他のリソースの場合はエラーを表示
            return new Response(
              'リソースをロードできませんでした。ネットワーク接続を確認してください。',
              { headers: { 'Content-Type': 'text/plain' } }
            );
          });
      })
  );
});

// アクティベート時に古いキャッシュを削除
self.addEventListener('activate', (event) => {
  console.log(`Service Worker (${APP_VERSION}) をアクティベートしています...`);
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // 現在のキャッシュ以外を削除
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log(`古いキャッシュを削除: ${cacheName}`);
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        })
      );
    })
    .then(() => {
      console.log(`Service Worker (${APP_VERSION}) のアクティベートが完了しました`);
      // 現在開いているページを制御するためにすぐに有効化
      return self.clients.claim();
    })
  );
});

// メッセージの受信
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_ONLINE_STATUS') {
    // クライアントにオンライン状態を返信
    event.source.postMessage({
      type: 'ONLINE_STATUS',
      online: !isOffline
    });
  }
}); 