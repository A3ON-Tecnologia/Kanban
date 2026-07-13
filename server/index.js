const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const boardsRouter = require('./routes/boards');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const deletedCardsRouter = require('./routes/deletedCards');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 8687;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/deleted-cards', deletedCardsRouter);
app.use('/api/boards', boardsRouter);
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// Serve o frontend buildado (pasta dist na raiz do projeto)
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath, {
  etag: false,
  lastModified: false,
  setHeaders(res) {
    res.setHeader('Cache-Control', 'no-store');
  },
}));

// Qualquer rota nÃ£o-API retorna o index.html (SPA)
app.get('*', (_, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

async function ensureCardNotifyColumn() {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS count
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = 'cards'
       AND column_name = 'notify_by_email'`
  );
  if (!rows[0] || rows[0].count === 0) {
    await pool.execute('ALTER TABLE cards ADD COLUMN notify_by_email TINYINT(1) NOT NULL DEFAULT 0 AFTER alert_minutes');
  }
}

async function ensureCardNotifyEmailMinutesColumn() {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS count
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = 'cards'
       AND column_name = 'notify_email_minutes'`
  );
  if (!rows[0] || rows[0].count === 0) {
    await pool.execute('ALTER TABLE cards ADD COLUMN notify_email_minutes INT NULL AFTER notify_by_email');
  }
}

async function ensureUserEmailColumn() {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS count
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = 'users'
       AND column_name = 'email'`
  );
  if (!rows[0] || rows[0].count === 0) {
    await pool.execute('ALTER TABLE users ADD COLUMN email VARCHAR(255) NULL AFTER username');
  }
}

async function start() {
  try {
    await ensureUserEmailColumn();
    await ensureCardNotifyColumn();
    await ensureCardNotifyEmailMinutesColumn();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor rodando em http://0.0.0.0:${PORT}`);
      console.log(`Acesso local:  http://localhost:${PORT}`);
      console.log(`Acesso na rede: http://<IP-DO-SERVIDOR>:${PORT}`);
    });
  } catch (err) {
    console.error('Falha ao iniciar servidor:', err.message);
    process.exit(1);
  }
}

start();


