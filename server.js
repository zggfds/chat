// server.js

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// --- 1. Настройки Файлов и Директорий ---
const LOG_FILE = path.join(__dirname, 'chat_history.json');
const PUBLIC_DIR = path.join(__dirname, 'public');
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads');

// Обслуживаем статические файлы
app.use(express.static(PUBLIC_DIR));

// Создаем папку для загрузок, если её нет
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// --- 2. Логика Сохранения Истории ---
let chatHistory = [];

function loadHistory() {
    try {
        if (fs.existsSync(LOG_FILE)) {
            const data = fs.readFileSync(LOG_FILE, 'utf8');
            chatHistory = JSON.parse(data);
            console.log(`Загружено ${chatHistory.length} сообщений из истории.`);
        }
    } catch (err) {
        console.error('Ошибка загрузки истории:', err);
    }
}
loadHistory();

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
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// --- 4. HTTP POST Эндпоинт для Загрузки Фото ---
app.post('/upload', upload.single('photo'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Файл не был загружен.' });
    }

    const timestamp = new Date().toLocaleString();
    const fileUrl = `/uploads/${req.file.filename}`;
    
    const photoMessage = {
        timestamp,
        type: 'photo',
        url: fileUrl
    };

    chatHistory.push(photoMessage);
    saveHistory();
    
    io.emit('chat message', photoMessage);

    res.json({ success: true, message: 'Фото загружено и отправлено в чат.', fileUrl: fileUrl });
});

// --- 5. Обработка Socket.IO Соединений ---
io.on('connection', (socket) => {
    console.log('Пользователь подключен');

    socket.emit('history', chatHistory);

    socket.on('disconnect', () => {
        console.log('Пользователь отключен');
    });

    socket.on('chat message', (msg) => {
        const timestamp = new Date().toLocaleString();
        
        const textMessage = {
            timestamp,
            type: 'text',
            text: msg
        };

        chatHistory.push(textMessage);
        saveHistory();
        
        io.emit('chat message', textMessage);
    });
});

// --- 6. Запуск Сервера ---
app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});