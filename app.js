const express = require('express');
const { v4: uuidv4 } = require('uuid');
const WebSocket = require('ws');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Для хранения сессий и ws соединений
const sessions = new Map();

app.use(bodyParser.json());
app.use(express.static('public'));

// Генерация уникального идентификатора сессии и отдача QR кода с URL
app.get('/qr', (req, res) => {
  const sessionId = uuidv4();
  // Сохраняем сессию с пустым соединением (позже заполним)
  sessions.set(sessionId, { authorized: false, ws: null });
  // Отдаем URL с сессией для генерации QR кода на фронтенде
  res.json({ url: `${req.protocol}://${req.get('host')}/login.html?session=${sessionId}`, sessionId });
});

// Страница входа: здесь POST на /login для аутентификации сессии
app.post('/login', (req, res) => {
  const { sessionId, username, password } = req.body;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(400).json({ success: false, message: 'Неверная сессия' });
  }

  // Пример простейшей аутентификации
  if (username === 'user' && password === 'pass') {
    session.authorized = true;

    // Если есть websocket, отправляем сигнал на компьютер
    if (session.ws && session.ws.readyState === WebSocket.OPEN) {
      session.ws.send(JSON.stringify({ type: 'authorized' }));
    }

    return res.json({ success: true, message: 'Успешный вход' });
  } else {
    return res.json({ success: false, message: 'Неверный логин или пароль' });
  }
});

const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Вебсокет сервер для связи с компьютером
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  // При подключении компьютер отправляет sessionId для привязки
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'register' && data.sessionId) {
        const session = sessions.get(data.sessionId);
        if (session) {
          session.ws = ws; // связываем ws с сессией
          ws.send(JSON.stringify({ type: 'registered' }));
        } else {
          ws.close();
        }
      }
    } catch (e) {
      ws.close();
    }
  });

  ws.on('close', () => {
    // Очищаем ws из сессий при отключении
    for (const [id, session] of sessions) {
      if (session.ws === ws) {
        sessions.delete(id);
        break;
      }
    }
  });
});
