const CACHE_NAME = 'pr14-pwa-cache-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/app.js',
    '/manifest.json',       // <-- Добавили манифест
    '/icons/icon-512.png'   // <-- Добавили иконку (проверь имя файла!)
];

// Установка: кэшируем файлы
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Кэширование новых ассетов');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// Активация: чистим старые кэши
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => {
                        console.log('[SW] Удаление старого кэша:', key);
                        return caches.delete(key);
                    })
            );
        })
    );
});

// Fetch: отдаем из кэша или идем в сеть
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) return response;
                return fetch(event.request);
            })
    );
});