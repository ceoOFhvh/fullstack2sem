// Подключение к серверу Socket.IO
const socket = io('http://localhost:3001');

const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const enablePushBtn = document.getElementById('enable-push');
const disablePushBtn = document.getElementById('disable-push');

// Твой публичный VAPID ключ
const PUBLIC_VAPID_KEY = 'BHmZI_zEDA-kh6wL3dKHVP8pUVIw__8qtvrUiVaHPLG5kh37GuZvmFFyPSkMdmd9yxgZuVh2RU3JzEljFRow7Dk'; 

// === 1. Логика Socket.IO ===

// При получении события 'taskAdded' от сервера
socket.on('taskAdded', (task) => {
    console.log('Получена задача через WS:', task);
    addTaskToUI(task.text);
    showToast(`Новая задача: ${task.text}`);
});

function addTaskToUI(text) {
    const li = document.createElement('li');
    li.textContent = text;
    taskList.prepend(li); // Добавляем в начало списка
}

// Отправка новой задачи
addBtn.addEventListener('click', () => {
    const text = taskInput.value.trim();
    if (!text) return;

    // Отправляем событие на сервер
    socket.emit('newTask', { text: text, timestamp: Date.now() });
    
    taskInput.value = '';
});

// === 2. Логика Push Notifications ===

// Преобразование VAPID ключа в формат Uint8Array
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

// Проверка текущей подписки и обновление кнопок
async function checkSubscription() {
    if (!('serviceWorker' in navigator)) return;
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();
    
    if (subscription) {
        enablePushBtn.style.display = 'none';
        disablePushBtn.style.display = 'inline-block';
    } else {
        enablePushBtn.style.display = 'inline-block';
        disablePushBtn.style.display = 'none';
    }
}

// Включение Push
enablePushBtn.addEventListener('click', async () => {
    if (Notification.permission === 'denied') {
        alert('Уведомления запрещены в настройках браузера.');
        return;
    }
    if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;
    }

    try {
        const reg = await navigator.serviceWorker.ready;
        const subscription = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
        });

        // Отправляем подписку на сервер
        await fetch('http://localhost:3001/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription)
        });

        console.log('Подписка на Push создана');
        checkSubscription();
    } catch (err) {
        console.error('Ошибка подписки:', err);
    }
});

// Отключение Push
disablePushBtn.addEventListener('click', async () => {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();
    
    if (subscription) {
        // Удаляем на сервере
        await fetch('http://localhost:3001/unsubscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ endpoint: subscription.endpoint })
        });
        
        // Отписываемся в браузере
        await subscription.unsubscribe();
        console.log('Отписка выполнена');
        checkSubscription();
    }
});

// === 3. Вспомогательные функции ===

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
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