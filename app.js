const express = require('express');
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

const sessions = new Map();

app.use(express.json());
app.use(express.static('public'));

// Запрос QR (создаёт сессию и отдаёт URL для QR)
app.get('/qr', (req, res) => {
  const sessionId = uuidv4();
  sessions.set(sessionId, { authorized: false });
  res.json({ url: `${req.protocol}://${req.get('host')}/login.html?session=${sessionId}`, sessionId });
});

// Вход по логину и паролю
app.post('/login', (req, res) => {
  const { sessionId, username, password } = req.body;
  const session = sessions.get(sessionId);
  if (!session) return res.status(400).json({ success: false, message: 'Неверная сессия' });
  if (username === 'user' && password === 'pass') {
    session.authorized = true;
    return res.json({ success: true, message: 'Вход выполнен' });
  }
  res.json({ success: false, message: 'Неправильный логин или пароль' });
});

// Проверка статуса (polling)
app.get('/status', (req, res) => {
  const { sessionId } = req.query;
  const session = sessions.get(sessionId);
  if (session && session.authorized) {
    return res.json({ authorized: true });
  }
  res.json({ authorized: false });
});

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});
