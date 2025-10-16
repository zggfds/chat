// server.js (Обновленный Серверный код Node.js)

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const fs = require('fs');
const path = require('path');
const multer = require('multer'); // Добавили Multer

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const LOG_FILE = path.join(__dirname, 'chat_history.json');
const UPLOADS_DIR = path.join(__dirname, 'public/uploads');

// --- 1. Настройка Хранения ---

// Публичная папка для статических файлов (HTML, JS, CSS, и загруженных фото)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS_DIR)); // Делаем загруженные файлы доступными по URL

// Создаем папку для загрузок, если её нет
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// --- 2. Логика Сохранения Истории ---

let chatHistory = [];

// Загрузка истории при старте сервера
function loadHistory() {
    try {
        if (fs.existsSync(LOG_FILE)) {
            const data = fs.readFileSync(LOG_FILE);
            chatHistory = JSON.parse(data);
            console.log(`Загружено ${chatHistory.length} сообщений из истории.`);
        }
    } catch (err) {
        console.error('Ошибка загрузки истории:', err);
    }
}
loadHistory();

// Сохранение истории в JSON файл
function saveHistory() {
    fs.writeFileSync(LOG_FILE, JSON.stringify(chatHistory, null, 2), (err) => {
        if (err) console.error('Ошибка сохранения истории:', err);
    });
}

// --- 3. Настройка Multer для Загрузки Файлов ---

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        // Создаем уникальное имя файла
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// --- 4. HTTP POST Эндпоинт для Загрузки Фото ---

app.post('/upload', upload.single('photo'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('Файл не был загружен.');
    }

    const timestamp = new Date().toLocaleString();
    // URL, по которому будет доступно фото: /uploads/имя_файла
    const fileUrl = `/uploads/${req.file.filename}`;
    
    const photoMessage = {
        timestamp,
        type: 'photo',
        url: fileUrl,
        text: `Пользователь отправил фото: ${req.file.filename}`
    };

    chatHistory.push(photoMessage);
    saveHistory();
    
    // Отправляем фото-сообщение всем клиентам через Socket.IO
    io.emit('chat message', photoMessage);

    res.json({ success: true, message: 'Фото загружено и отправлено в чат.' });
});

// --- 5. Обработка Socket.IO Соединений ---

io.on('connection', (socket) => {
    console.log('Пользователь подключен');

    // 1. Отправка полной истории новому пользователю
    socket.emit('history', chatHistory);

    socket.on('disconnect', () => {
        console.log('Пользователь отключен');
    });

    // 2. Обработка текстовых сообщений
    socket.on('chat message', (msg) => {
        const timestamp = new Date().toLocaleString();
        
        const textMessage = {
            timestamp,
            type: 'text',
            text: msg
        };

        chatHistory.push(textMessage);
        saveHistory();
        
        // Отправка сообщения всем клиентам
        io.emit('chat message', textMessage);
    });
});

// --- 6. Запуск Сервера ---

// Обязательно обслуживаем index.html как статичный файл из папки public
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});