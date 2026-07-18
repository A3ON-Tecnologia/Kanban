const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const boardsRouter = require('./routes/boards');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const deletedCardsRouter = require('./routes/deletedCards');
const pool = require('./db');
const nodemailer = require('nodemailer');
const { getSmsConfig, normalizePhone, sendSms } = require('./sms');

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

function createMailTransportFromConfig(cfg) {
  if (!cfg?.host || !cfg?.user || !cfg?.pass) return null;
  return nodemailer.createTransport({
    host: cfg.host,
    port: Number(cfg.port || 587),
    secure: !!cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
  });
}

function getGlobalMailConfig() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return { host, port: Number(process.env.SMTP_PORT || 587), secure: String(process.env.SMTP_SECURE || 'false') === 'true', user, pass, from: process.env.MAIL_FROM || user };
}

async function ensureCardNotifySentAtColumn() {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS count
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = 'cards'
       AND column_name = 'notify_email_sent_at'`
  );
  if (!rows[0] || rows[0].count === 0) {
    await pool.execute('ALTER TABLE cards ADD COLUMN notify_email_sent_at DATETIME NULL AFTER notify_email_minutes');
  }
}

async function ensureCardNotifyUserColumn() {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS count
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = 'cards'
       AND column_name = 'notify_email_user_id'`
  );
  if (!rows[0] || rows[0].count === 0) {
    await pool.execute('ALTER TABLE cards ADD COLUMN notify_email_user_id VARCHAR(36) NULL AFTER notify_email_sent_at');
  }
}

// Colunas do alerta por SMS — espelham as de e-mail, mas são independentes:
// um card pode ter e-mail, SMS, os dois, ou nenhum.
async function ensureCardSmsColumns() {
  const columns = [
    ['notify_by_sms', 'TINYINT(1) NOT NULL DEFAULT 0 AFTER notify_email_user_id'],
    ['notify_sms_minutes', 'INT NULL AFTER notify_by_sms'],
    ['notify_sms_sent_at', 'DATETIME NULL AFTER notify_sms_minutes'],
  ];
  for (const [column, ddl] of columns) {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS count
       FROM information_schema.columns
       WHERE table_schema = DATABASE()
         AND table_name = 'cards'
         AND column_name = ?`,
      [column]
    );
    if (!rows[0] || rows[0].count === 0) {
      await pool.execute(`ALTER TABLE cards ADD COLUMN ${column} ${ddl}`);
    }
  }
}

async function sendCardAlertEmail(card, actorUserId, boardTitle) {
  const recipientUserId = card.notifyEmailUserId || card.createdBy || actorUserId || null;
  const [userRows] = await pool.execute(
    'SELECT id, username, email, smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass FROM users WHERE id = ?',
    [recipientUserId]
  );
  const recipientUser = userRows[0];
  const globalCfg = getGlobalMailConfig();
  const cfg = recipientUser?.smtp_host && recipientUser?.smtp_user && recipientUser?.smtp_pass
    ? { host: recipientUser.smtp_host, port: recipientUser.smtp_port || 587, secure: !!recipientUser.smtp_secure, user: recipientUser.smtp_user, pass: recipientUser.smtp_pass, from: recipientUser.smtp_user }
    : globalCfg;

  const transporter = createMailTransportFromConfig(cfg);
  if (!transporter) {
    console.log('[notify] skip no smtp', { cardId: card.id, cardTitle: card.title, recipientUserId, cfg, globalConfigured: !!globalCfg });
    return false;
  }

  const recipient = recipientUser?.email || process.env.MAIL_TO || null;
  if (!recipient) {
    console.log('[notify] skip no recipient email', { cardId: card.id, cardTitle: card.title, recipientUserId, createdBy: card.createdBy });
    return false;
  }

  const due = card.dueDate ? new Date(card.dueDate) : null;
  const minutesBefore = Number.isFinite(Number(card.notifyEmailMinutes)) ? Number(card.notifyEmailMinutes) : 1440;
  const label = minutesBefore === 0 ? 'no dia' : minutesBefore >= 1440 ? `${minutesBefore / 1440} dia(s) antes` : minutesBefore >= 60 ? `${minutesBefore / 60} hora(s) antes` : `${minutesBefore} min antes`;
  const dueText = due && !Number.isNaN(due.getTime()) ? due.toLocaleString('pt-BR') : 'sem vencimento';

  console.log('[notify] sending', { cardId: card.id, recipient, recipientUserId, minutesBefore, due: due?.toISOString?.(), cfgUser: cfg.user, cfgHost: cfg.host });
  await transporter.sendMail({
    from: cfg.from,
    to: recipient,
    subject: `Lembrete: ${card.title} vence em breve`,
    text: `Olá ${recipientUser?.username || ''},\n\nO card "${card.title}" do quadro "${boardTitle || 'Kanban'}" está programado para lembrar ${label}.\nVencimento: ${dueText}\n\nAcesse o Kanban para acompanhar o status.`,
  });

  await pool.execute('UPDATE cards SET notify_email_sent_at = NOW() WHERE id = ?', [card.id]);
  console.log('[notify] sent', card.id);
  return true;
}

// Se o horário de envio já passou há mais de 24h, o lembrete perdeu o sentido.
// Evita disparar uma enxurrada de e-mails de cards antigos/vencidos.
const NOTIFY_GRACE_MS = 24 * 60 * 60 * 1000;

async function processEmailNotifications() {
  const globalCfg = getGlobalMailConfig();
  console.log('[notify] worker tick', { globalConfigured: !!globalCfg });

  const [cards] = await pool.execute(
    `SELECT c.id, c.title, c.due_date, c.notify_email_minutes, c.notify_email_sent_at, c.notify_email_user_id, c.created_by, c.column_id, b.title AS board_title, u.email AS recipient_email, u.username AS recipient_username, u.smtp_host, u.smtp_port, u.smtp_secure, u.smtp_user, u.smtp_pass
     FROM cards c
     JOIN columns_tbl col ON col.id = c.column_id
     JOIN boards b ON b.id = col.board_id
     LEFT JOIN users u ON u.id = COALESCE(c.notify_email_user_id, c.created_by)
     WHERE c.notify_by_email = 1
       AND (c.created_by IS NOT NULL OR c.notify_email_user_id IS NOT NULL)`
  );

  const now = Date.now();
  for (const card of cards) {
    if (card.notify_email_sent_at) { console.log('[notify] skip already sent', card.id); continue; }
    if (!card.due_date) { console.log('[notify] skip no due date', card.id); continue; }

    const due = new Date(card.due_date);
    if (Number.isNaN(due.getTime())) { console.log('[notify] skip invalid due date', card.id, card.due_date); continue; }
    const minutesBefore = Number.isFinite(Number(card.notify_email_minutes)) ? Number(card.notify_email_minutes) : 1440;
    const notifyAt = due.getTime() - (minutesBefore * 60 * 1000);
    if (now < notifyAt) { console.log('[notify] skip not due yet', card.id, { due: due.toISOString(), notifyAt: new Date(notifyAt).toISOString(), now: new Date(now).toISOString(), minutesBefore }); continue; }
    if (now - notifyAt > NOTIFY_GRACE_MS) { console.log('[notify] skip window expired', card.id, { due: due.toISOString(), notifyAt: new Date(notifyAt).toISOString() }); continue; }

    try {
      await sendCardAlertEmail({
        id: card.id,
        title: card.title,
        createdBy: card.created_by,
        notifyEmailUserId: card.notify_email_user_id,
        notifyEmailMinutes: card.notify_email_minutes,
        dueDate: card.due_date,
      }, card.notify_email_user_id || card.created_by, card.board_title);
    } catch (err) {
      console.error('[notify] send failed', card.id, err.message);
    }
  }
}

// ===== Notificação por SMS =====
// As primitivas do provedor (getSmsConfig/normalizePhone/sendSms) ficam em ./sms.js.
async function sendCardAlertSms(card, actorUserId, boardTitle) {
  const cfg = getSmsConfig();
  if (!cfg) {
    console.log('[sms] skip no provider config', { cardId: card.id, cardTitle: card.title });
    return false;
  }
  const recipientUserId = card.notifyEmailUserId || card.createdBy || actorUserId || null;
  const [userRows] = await pool.execute(
    'SELECT id, username, phone FROM users WHERE id = ?',
    [recipientUserId]
  );
  const recipientUser = userRows[0];
  const to = normalizePhone(recipientUser?.phone);
  if (!to) {
    console.log('[sms] skip no recipient phone', { cardId: card.id, cardTitle: card.title, recipientUserId });
    return false;
  }

  const due = card.dueDate ? new Date(card.dueDate) : null;
  const dueText = due && !Number.isNaN(due.getTime()) ? due.toLocaleString('pt-BR') : 'sem vencimento';
  const body = `Kanban: o card "${card.title}" (${boardTitle || 'Kanban'}) vence em ${dueText}.`;

  console.log('[sms] sending', { cardId: card.id, to, recipientUserId });
  await sendSms(cfg, to, body);
  await pool.execute('UPDATE cards SET notify_sms_sent_at = NOW() WHERE id = ?', [card.id]);
  console.log('[sms] sent', card.id);
  return true;
}

async function processSmsNotifications() {
  const cfg = getSmsConfig();
  console.log('[sms] worker tick', { configured: !!cfg });
  if (!cfg) return;

  const [cards] = await pool.execute(
    `SELECT c.id, c.title, c.due_date, c.notify_sms_minutes, c.notify_sms_sent_at, c.notify_email_user_id, c.created_by, c.column_id, b.title AS board_title, u.phone AS recipient_phone
     FROM cards c
     JOIN columns_tbl col ON col.id = c.column_id
     JOIN boards b ON b.id = col.board_id
     LEFT JOIN users u ON u.id = COALESCE(c.notify_email_user_id, c.created_by)
     WHERE c.notify_by_sms = 1
       AND (c.created_by IS NOT NULL OR c.notify_email_user_id IS NOT NULL)`
  );

  const now = Date.now();
  for (const card of cards) {
    if (card.notify_sms_sent_at) { console.log('[sms] skip already sent', card.id); continue; }
    if (!card.due_date) { console.log('[sms] skip no due date', card.id); continue; }

    const due = new Date(card.due_date);
    if (Number.isNaN(due.getTime())) { console.log('[sms] skip invalid due date', card.id, card.due_date); continue; }
    const minutesBefore = Number.isFinite(Number(card.notify_sms_minutes)) ? Number(card.notify_sms_minutes) : 1440;
    const notifyAt = due.getTime() - (minutesBefore * 60 * 1000);
    if (now < notifyAt) { console.log('[sms] skip not due yet', card.id); continue; }
    if (now - notifyAt > NOTIFY_GRACE_MS) { console.log('[sms] skip window expired', card.id); continue; }

    try {
      await sendCardAlertSms({
        id: card.id,
        title: card.title,
        createdBy: card.created_by,
        notifyEmailUserId: card.notify_email_user_id,
        notifySmsMinutes: card.notify_sms_minutes,
        dueDate: card.due_date,
      }, card.notify_email_user_id || card.created_by, card.board_title);
    } catch (err) {
      console.error('[sms] send failed', card.id, err.message);
    }
  }
}

global.__processSmsNotifications = processSmsNotifications;
global.__processEmailNotifications = processEmailNotifications;

function startNotificationWorker() {
  processEmailNotifications().catch(err => console.error('Email notifications bootstrap:', err.message));
  processSmsNotifications().catch(err => console.error('SMS notifications bootstrap:', err.message));
  setInterval(() => {
    processEmailNotifications().catch(err => console.error('Email notifications tick:', err.message));
    processSmsNotifications().catch(err => console.error('SMS notifications tick:', err.message));
  }, 60 * 1000);
}

app.post('/api/debug/run-notifications', async (req, res) => {
  try {
    await processEmailNotifications();
    await processSmsNotifications();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

// Telefone do usuário — destinatário do alerta por SMS (formato E.164, ex.: +5511999998888).
async function ensureUserPhoneColumn() {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS count
     FROM information_schema.columns
     WHERE table_schema = DATABASE()
       AND table_name = 'users'
       AND column_name = 'phone'`
  );
  if (!rows[0] || rows[0].count === 0) {
    await pool.execute('ALTER TABLE users ADD COLUMN phone VARCHAR(32) NULL AFTER email');
  }
}

async function ensureUserSmtpColumns() {
  const columns = [
    ['smtp_host', 'VARCHAR(255) NULL AFTER email'],
    ['smtp_port', 'INT NULL AFTER smtp_host'],
    ['smtp_secure', 'TINYINT(1) NOT NULL DEFAULT 0 AFTER smtp_port'],
    ['smtp_user', 'VARCHAR(255) NULL AFTER smtp_secure'],
    ['smtp_pass', 'VARCHAR(255) NULL AFTER smtp_user'],
  ];

  for (const [column, ddl] of columns) {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) AS count
       FROM information_schema.columns
       WHERE table_schema = DATABASE()
         AND table_name = 'users'
         AND column_name = ?`,
      [column]
    );
    if (!rows[0] || rows[0].count === 0) {
      await pool.execute(`ALTER TABLE users ADD COLUMN ${column} ${ddl}`);
    }
  }
}

async function start() {
  try {
    await ensureUserEmailColumn();
    await ensureUserPhoneColumn();
    await ensureUserSmtpColumns();
    await ensureCardNotifyColumn();
    await ensureCardNotifyEmailMinutesColumn();
    await ensureCardNotifyUserColumn();
    await ensureCardNotifySentAtColumn();
    await ensureCardSmsColumns();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor rodando em http://0.0.0.0:${PORT}`);
      console.log(`Acesso local:  http://localhost:${PORT}`);
      console.log(`Acesso na rede: http://<IP-DO-SERVIDOR>:${PORT}`);
    });
    startNotificationWorker();
  } catch (err) {
    console.error('Falha ao iniciar servidor:', err.message);
    process.exit(1);
  }
}

start();


