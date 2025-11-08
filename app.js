const express = require('express');
const { v4: uuidv4 } = require('uuid');
const WebSocket = require('ws');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Хранилище сессий
const sessions = new Map();

app.use(bodyParser.json());
app.use(express.static('public'));

// Маршрут для генерации уникальной сессии и URL в QR
app.get('/qr', (req, res) => {
  const sessionId = uuidv4();
  sessions.set(sessionId, { authorized: false, ws: null });
  res.json({ url: `${req.protocol}://${req.get('host')}/login.html?session=${sessionId}`, sessionId });
});

// Обработка входа с логином и паролем
app.post('/login', (req, res) => {
  const { sessionId, username, password } = req.body;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(400).json({ success: false, message: 'Неверная сессия' });
  }

  // Пример простейшей проверки
  if (username === 'user' && password === 'pass') {
    session.authorized = true;

    if (session.ws && session.ws.readyState === WebSocket.OPEN) {
      session.ws.send(JSON.stringify({ type: 'authorized' }));
    }

    return res.json({ success: true, message: 'Успешный вход' });
  } else {
    return res.json({ success: false, message: 'Неверный логин или пароль' });
  }
});

const server = app.listen(PORT, () => {
  console.log(`Server запускается по адресу http://localhost:${PORT}`);
});

// WebSocket сервер для связи с компьютером
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'register' && data.sessionId) {
        const session = sessions.get(data.sessionId);
        if (session) {
          session.ws = ws;
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
    for (const [id, session] of sessions) {
      if (session.ws === ws) {
        sessions.delete(id);
        break;
      }
    }
  });
});
