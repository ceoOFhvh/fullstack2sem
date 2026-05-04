self.addEventListener('push', (event) => {
    let data = { title: 'Уведомление', body: '', reminderId: null };
    if (event.data) {
        try { data = event.data.json(); } catch (e) { data.body = event.data.text(); }
    }

    const options = {
        body: data.body,
        icon: '/icons/icon-512.png',
        badge: '/icons/icon-512.png',
        data: { reminderId: data.reminderId }, // Передаем ID в данные уведомления
        actions: []
    };

    // Если это напоминание (есть ID), добавляем кнопку "Отложить"
    if (data.reminderId) {
        options.actions = [
            { action: 'snooze', title: '⏳ Отложить на 5 мин' }
        ];
    }

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Обработка клика по уведомлению или кнопкам
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'snooze') {
        // Пользователь нажал "Отложить"
        const reminderId = event.notification.data.reminderId;
        if (reminderId) {
            // Отправляем запрос на сервер
            event.waitUntil(
                fetch(`http://localhost:3001/snooze?reminderId=${reminderId}`, {
                    method: 'POST'
                }).then(() => {
                    console.log('Напоминание отложено на сервере');
                }).catch(err => console.error('Snooze fetch error:', err))
            );
        }
    } else {
        // Клик по самому уведомлению - открываем приложение
        event.waitUntil(clients.openWindow('/'));
    }
});