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
// ВСТАВЬ СЮДА СВОИ КЛЮЧИ!
const publicVapidKey = 'BG73emJ1n5IRzYzgyMWQyvhh9758p46cdVxhqojeyuxDmmbv_quXjTjkhtkVoiCSXfRHPuIswRB3lNeuFVlEJVM'; 
const privateVapidKey = 'qOs0nN50_Ie70pe4sEbV65NBTj4pUYhb_publgM54wQ';

webpush.setVapidDetails(
    'mailto:test@example.com',
    publicVapidKey,
    privateVapidKey
);

// Хранилище подписок на Push
let pushSubscriptions = [];

// Хранилище активных напоминаний: Map<reminderId, { timeoutId, text }>
const reminders = new Map();

const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// ==================== SOCKET.IO ЛОГИКА ====================

io.on('connection', (socket) => {
    console.log('Клиент подключен:', socket.id);

    // 1. Обычная задача (как в PR16)
    socket.on('newTask', (taskData) => {
        console.log('Получена новая задача:', taskData);
        io.emit('taskAdded', taskData);
        
        const payload = JSON.stringify({
            title: 'Новая задача!',
            body: taskData.text
        });

        pushSubscriptions.forEach(subscription => {
            webpush.sendNotification(subscription, payload).catch(err => console.error('Push error:', err));
        });
    });

    // 2. НОВАЯ ЛОГИКА: Задача с напоминанием
    socket.on('newReminder', (reminderData) => {
        const { id, text, reminderTime } = reminderData;
        const delay = reminderTime - Date.now();

        if (delay <= 0) {
            console.log('Время напоминания уже прошло');
            return;
        }

        console.log(`Запланировано напоминание ID ${id} через ${Math.round(delay/1000)} сек.`);

        // Сохраняем таймер
        const timeoutId = setTimeout(() => {
            console.log(`Отправка напоминания ID ${id}`);
            
            // Отправляем Push всем подписчикам
            const payload = JSON.stringify({
                title: '⏰ Напоминание!',
                body: text,
                reminderId: id // Важно для кнопки "Отложить"
            });

            pushSubscriptions.forEach(subscription => {
                webpush.sendNotification(subscription, payload).catch(err => {
                    console.error('Ошибка отправки push напоминания:', err);
                    if (err.statusCode === 404 || err.statusCode === 410) {
                        pushSubscriptions = pushSubscriptions.filter(s => s !== subscription);
                    }
                });
            });

            // Удаляем из хранилища после отправки
            reminders.delete(id);
        }, delay);

        reminders.set(id, { timeoutId, text });
    });

    socket.on('disconnect', () => {
        console.log('Клиент отключен:', socket.id);
    });
});

// ==================== ЭНДПОИНТЫ ====================

// Подписка на Push
app.post('/subscribe', (req, res) => {
    const subscription = req.body;
    const isExists = pushSubscriptions.some(sub => sub.endpoint === subscription.endpoint);
    if (!isExists) {
        pushSubscriptions.push(subscription);
    }
    res.status(201).json({ message: 'Подписка сохранена' });
});

// Отписка
app.post('/unsubscribe', (req, res) => {
    const { endpoint } = req.body;
    pushSubscriptions = pushSubscriptions.filter(sub => sub.endpoint !== endpoint);
    res.status(200).json({ message: 'Подписка удалена' });
});

// НОВЫЙ ЭНДПОИНТ: Отложить напоминание (Snooze)
app.post('/snooze', (req, res) => {
    const reminderId = parseInt(req.query.reminderId, 10);
    
    if (!reminders.has(reminderId)) {
        return res.status(404).json({ error: 'Reminder not found or already sent' });
    }

    const reminder = reminders.get(reminderId);
    
    // Отменяем старый таймер
    clearTimeout(reminder.timeoutId);
    console.log(`Напоминание ${reminderId} отложено на 5 минут.`);

    // Устанавливаем новый таймер на 5 минут (300 000 мс)
    const newDelay = 5 * 60 * 1000;
    const newTimeoutId = setTimeout(() => {
        const payload = JSON.stringify({
            title: '⏰ Напоминание (отложено)',
            body: reminder.text,
            reminderId: reminderId
        });

        pushSubscriptions.forEach(subscription => {
            webpush.sendNotification(subscription, payload).catch(err => console.error('Snooze push error:', err));
        });
        reminders.delete(reminderId);
    }, newDelay);

    // Обновляем запись в Map
    reminders.set(reminderId, { timeoutId: newTimeoutId, text: reminder.text });

    res.status(200).json({ message: 'Reminder snoozed for 5 minutes' });
});

const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Сервер PR17 запущен на http://localhost:${PORT}`);
});