const CACHE_NAME = 'pr15-app-shell-v1';
const DYNAMIC_CACHE_NAME = 'pr15-dynamic-content-v1';

// Файлы App Shell (кэшируются сразу)
const SHELL_ASSETS = [
    '/',
    '/index.html',
    '/app.js',
    '/manifest.json',
    '/icons/icon-512.png'
];

// Установка: кэшируем оболочку
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(SHELL_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Активация: чистим старые кэши
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME && key !== DYNAMIC_CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch: стратегия гибридного кэширования
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Пропускаем запросы не к нашему домену (например, внешние скрипты)
    if (url.origin !== location.origin) return;

    // 1. Динамический контент (/content/*.html) -> Network First
    if (url.pathname.startsWith('/content/')) {
        event.respondWith(
            fetch(event.request)
                .then(networkRes => {
                    // Если сеть есть, кэшируем ответ и возвращаем его
                    const resClone = networkRes.clone();
                    caches.open(DYNAMIC_CACHE_NAME).then(cache => {
                        cache.put(event.request, resClone);
                    });
                    return networkRes;
                })
                .catch(() => {
                    // Если сети нет, берем из кэша
                    return caches.match(event.request)
                        .then(cachedRes => cachedRes || caches.match('/content/home.html'));
                })
        );
    } 
    // 2. Статика (App Shell) -> Cache First
    else {
        event.respondWith(
            caches.match(event.request)
                .then(cachedRes => cachedRes || fetch(event.request))
        );
    }
});