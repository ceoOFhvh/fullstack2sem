self.addEventListener('push', (event) => {
    let data = { title: 'Новое уведомление', body: '' };
    
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: '/icons/icon-512.png', // Убедись, что иконка есть
        badge: '/icons/icon-512.png',
        vibrate: [100, 50, 100],
        data: { dateOfArrival: Date.now() },
        actions: [
            { action: 'explore', title: 'Открыть приложение' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
});