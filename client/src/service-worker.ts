/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals */

// Service Workerファイル
// PWAとしてオフライン機能を提供するためのもの

// ServiceWorkerGlobalScopeを型定義
declare const self: ServiceWorkerGlobalScope;

// キャッシュの名前
const CACHE_NAME = 'jankenWars-cache-v1';

// キャッシュするリソース
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/favicon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// インストール時にキャッシュを作成
self.addEventListener('install', (event) => {
  // イベントが終了するまで待機
  event.waitUntil(
    // キャッシュを開く
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened');
        // 指定したリソースをキャッシュに追加
        return cache.addAll(urlsToCache);
      })
  );
});

// ネットワークリクエストをインターセプト
self.addEventListener('fetch', (event) => {
  event.respondWith(
    // キャッシュを検索
    caches.match(event.request)
      .then((response) => {
        // キャッシュが見つかった場合はそれを返す
        if (response) {
          return response;
        }
        // キャッシュが見つからない場合はネットワークからフェッチ
        return fetch(event.request).then(
          (response) => {
            // 有効なレスポンスでない場合はそのまま返す
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // レスポンスをクローンしてキャッシュに保存
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                // リクエストとレスポンスをペアでキャッシュ
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

// アクティベート時に古いキャッシュを削除
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // 現在のキャッシュ以外を削除
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        })
      );
    })
  );
}); 