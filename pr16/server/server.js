const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Раздаем статику из папки ../client
app.use(express.static(path.join(__dirname, '../client')));

// ==================== НАСТРОЙКА VAPID ====================
// Твои сгенерированные ключи
const publicVapidKey = 'BHmZI_zEDA-kh6wL3dKHVP8pUVIw__8qtvrUiVaHPLG5kh37GuZvmFFyPSkMdmd9yxgZuVh2RU3JzEljFRow7Dk'; 
const privateVapidKey = '1rSAyiGn33gOMNSy_FXQ-Iz0zdGWr4JS7W3mthxq_Zg';

webpush.setVapidDetails(
    'mailto:test@example.com', // Твой email (можно фейковый)
    publicVapidKey,
    privateVapidKey
);

// Хранилище подписок на Push (в памяти)
let pushSubscriptions = [];

const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// ==================== SOCKET.IO ЛОГИКА ====================

io.on('connection', (socket) => {
    console.log('Клиент подключен:', socket.id);

    // Когда клиент отправляет новую задачу
    socket.on('newTask', (taskData) => {
        console.log('Получена новая задача:', taskData);

        // 1. Рассылаем всем клиентам через WebSocket (для открытых вкладок)
        io.emit('taskAdded', taskData);

        // 2. Отправляем Push-уведомление всем подписчикам (для закрытых/неактивных вкладок)
        const payload = JSON.stringify({
            title: 'Новая задача!',
            body: taskData.text
        });

        pushSubscriptions.forEach(subscription => {
            webpush.sendNotification(subscription, payload).catch(err => {
                console.error('Ошибка отправки push:', err);
                // Если подписка невалидна (например, пользователь отписался), удаляем её
                if (err.statusCode === 404 || err.statusCode === 410) {
                    pushSubscriptions = pushSubscriptions.filter(s => s !== subscription);
                }
            });
        });
    });

    socket.on('disconnect', () => {
        console.log('Клиент отключен:', socket.id);
    });
});

// ==================== ЭНДПОИНТЫ ДЛЯ PUSH ПОДПИСОК ====================

// Сохранение подписки
app.post('/subscribe', (req, res) => {
    const subscription = req.body;
    // Проверяем, нет ли уже такой подписки
    const isExists = pushSubscriptions.some(sub => sub.endpoint === subscription.endpoint);
    if (!isExists) {
        pushSubscriptions.push(subscription);
        console.log('Новая push-подписка сохранена. Всего:', pushSubscriptions.length);
    }
    res.status(201).json({ message: 'Подписка сохранена' });
});

// Удаление подписки
app.post('/unsubscribe', (req, res) => {
    const { endpoint } = req.body;
    pushSubscriptions = pushSubscriptions.filter(sub => sub.endpoint !== endpoint);
    console.log('Подписка удалена. Осталось:', pushSubscriptions.length);
    res.status(200).json({ message: 'Подписка удалена' });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
    console.log(`Public VAPID Key for client: ${publicVapidKey}`);
});