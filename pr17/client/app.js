document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded, starting app...");

    // Подключение к серверу Socket.IO
    const socket = io('http://localhost:3001');

    // Получаем элементы
    const taskInput = document.getElementById('taskInput');
    const addBtn = document.getElementById('addBtn');
    const reminderText = document.getElementById('reminderText');
    const reminderTime = document.getElementById('reminderTime');
    const addReminderBtn = document.getElementById('addReminderBtn');
    const taskList = document.getElementById('taskList');
    const enablePushBtn = document.getElementById('enable-push');
    const disablePushBtn = document.getElementById('disable-push');

    // Проверка, что все элементы найдены
    if (!addBtn || !enablePushBtn) {
        console.error("ERROR: Buttons not found! Check index.html IDs.");
        return;
    }
    console.log("Buttons found successfully.");

    const PUBLIC_VAPID_KEY = 'BG73emJ1n5IRzYzgyMWQyvhh9758p46cdVxhqojeyuxDmmbv_quXjTjkhtkVoiCSXfRHPuIswRB3lNeuFVlEJVM'; 

    // === 1. Socket.IO Logic ===

    socket.on('connect', () => {
        console.log("Connected to Socket.IO server!");
    });

    socket.on('taskAdded', (task) => {
        console.log('Received task via WS:', task);
        addTaskToUI(task.text);
        showToast(`Задача: ${task.text}`);
    });

    function addTaskToUI(text) {
        const li = document.createElement('li');
        li.textContent = text;
        taskList.prepend(li);
    }

    // Обработчик кнопки "Добавить" (Обычная задача)
    addBtn.addEventListener('click', () => {
        console.log("Add button clicked!"); // Лог для проверки
        const text = taskInput.value.trim();
        if (!text) return;
        
        socket.emit('newTask', { text: text });
        taskInput.value = '';
    });

    // Обработчик кнопки "Добавить с напоминанием"
    if (addReminderBtn) {
        addReminderBtn.addEventListener('click', () => {
            console.log("Reminder button clicked!");
            const text = reminderText.value.trim();
            const timeVal = reminderTime.value;
            
            if (!text || !timeVal) {
                alert('Введите текст и выберите время');
                return;
            }

            const reminderTimestamp = new Date(timeVal).getTime();
            const now = Date.now();

            if (reminderTimestamp <= now) {
                alert('Выберите время в будущем!');
                return;
            }

            const reminderId = Date.now(); 
            
            socket.emit('newReminder', {
                id: reminderId,
                text: text,
                reminderTime: reminderTimestamp
            });

            alert(`Напоминание запланировано на ${new Date(reminderTimestamp).toLocaleString()}`);
            reminderText.value = '';
            reminderTime.value = '';
        });
    }

    // === 2. Push Logic ===

    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    async function checkSubscription() {
        if (!('serviceWorker' in navigator)) return;
        try {
            const reg = await navigator.serviceWorker.ready;
            const subscription = await reg.pushManager.getSubscription();
            if (subscription) {
                if(enablePushBtn) enablePushBtn.style.display = 'none';
                if(disablePushBtn) disablePushBtn.style.display = 'inline-block';
            } else {
                if(enablePushBtn) enablePushBtn.style.display = 'inline-block';
                if(disablePushBtn) disablePushBtn.style.display = 'none';
            }
        } catch (err) {
            console.error("Check sub error", err);
        }
    }

    if (enablePushBtn) {
        enablePushBtn.addEventListener('click', async () => {
            console.log("Enable push clicked");
            if (Notification.permission === 'denied') {
                alert('Уведомления запрещены.');
                return;
            }
            if (Notification.permission === 'default') {
                const perm = await Notification.requestPermission();
                if (perm !== 'granted') return;
            }
            try {
                const reg = await navigator.serviceWorker.ready;
                const sub = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
                });
                await fetch('http://localhost:3001/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(sub)
                });
                console.log('Subscribed');
                checkSubscription();
            } catch (err) { 
                console.error('Subscribe error:', err); 
            }
        });
    }

    if (disablePushBtn) {
        disablePushBtn.addEventListener('click', async () => {
            console.log("Disable push clicked");
            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.getSubscription();
            if (sub) {
                await fetch('http://localhost:3001/unsubscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ endpoint: sub.endpoint })
                });
                await sub.unsubscribe();
                checkSubscription();
            }
        });
    }

    function showToast(msg) {
        const t = document.createElement('div');
        t.className = 'toast';
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 3000);
    }

    // Регистрация Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', async () => {
            try {
                await navigator.serviceWorker.register('/sw.js');
                console.log('SW registered');
                checkSubscription();
            } catch (err) {
                console.error('SW registration failed:', err);
            }
        });
    }
});