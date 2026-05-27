const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const boardsRouter = require('./routes/boards');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API
app.use('/api/boards', boardsRouter);
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// Serve o frontend buildado (pasta dist na raiz do projeto)
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// Qualquer rota não-API retorna o index.html (SPA)
app.get('*', (_, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando em http://0.0.0.0:${PORT}`);
  console.log(`Acesso local:  http://localhost:${PORT}`);
  console.log(`Acesso na rede: http://<IP-DO-SERVIDOR>:${PORT}`);
});
