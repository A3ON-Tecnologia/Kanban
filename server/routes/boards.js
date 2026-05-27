const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/boards — lista quadros filtrados por usuário
router.get('/', async (req, res) => {
  try {
    let boards;
    const mine = req.query.mine === 'true';
    if (req.user.role === 'admin' && !mine) {
      [boards] = await pool.execute('SELECT * FROM boards ORDER BY created_at');
    } else {
      // Quadros criados pelo usuário OU que ele tem acesso
      [boards] = await pool.execute(
        `SELECT DISTINCT b.* FROM boards b
         LEFT JOIN board_access ba ON ba.board_id = b.id
         WHERE b.created_by = ? OR ba.user_id = ?
         ORDER BY b.created_at`,
        [req.user.id, req.user.id]
      );
    }
    const result = [];

    for (const board of boards) {
      const [columns] = await pool.execute(
        'SELECT * FROM columns_tbl WHERE board_id = ? ORDER BY position',
        [board.id]
      );

      const cols = [];
      for (const col of columns) {
        const [cards] = await pool.execute(
          'SELECT * FROM cards WHERE column_id = ? ORDER BY position',
          [col.id]
        );

        const cardsList = [];
        for (const card of cards) {
          const [items] = await pool.execute(
            'SELECT * FROM checklist_items WHERE card_id = ? ORDER BY position',
            [card.id]
          );

          const [comments] = await pool.execute(
            'SELECT * FROM comments WHERE card_id = ? ORDER BY created_at',
            [card.id]
          );

          cardsList.push({
            id:           card.id,
            title:        card.title,
            description:  card.description || '',
            color:        card.color || '',
            priority:     card.priority || '',
            dueDate:      card.due_date || '',
            alertMinutes: card.alert_minutes || 30,
            createdAt:    card.created_at,
            checklist:    items.map(i => ({ id: i.id, text: i.text, done: i.done === 1 })),
            comments:     comments.map(c => ({ id: c.id, text: c.text, createdAt: c.created_at })),
          });
        }

        cols.push({ id: col.id, title: col.title, color: col.color || '', color2: col.color2 || '', cards: cardsList });
      }

      result.push({ id: board.id, title: board.title, createdBy: board.created_by || null, columns: cols });
    }

    res.json(result);
  } catch (err) {
    console.error('GET /boards:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/boards — cria um novo quadro
router.post('/', async (req, res) => {
  const board = req.body;
  try {
    await pool.execute(
      'INSERT INTO boards (id, title, created_by) VALUES (?, ?, ?)',
      [board.id, board.title, req.user.id]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('POST /boards:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/boards/:id — salva o estado completo do quadro
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const board = req.body;
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // Upsert do quadro
    await conn.execute(
      'INSERT INTO boards (id, title) VALUES (?, ?) ON DUPLICATE KEY UPDATE title = ?',
      [id, board.title, board.title]
    );

    // Apaga colunas antigas (cascata apaga cards e checklist)
    await conn.execute('DELETE FROM columns_tbl WHERE board_id = ?', [id]);

    // Reinsere tudo
    for (let ci = 0; ci < board.columns.length; ci++) {
      const col = board.columns[ci];
      await conn.execute(
        'INSERT INTO columns_tbl (id, board_id, title, position, color, color2) VALUES (?, ?, ?, ?, ?, ?)',
        [col.id, id, col.title, ci, col.color || null, col.color2 || null]
      );

      for (let cardI = 0; cardI < col.cards.length; cardI++) {
        const card = col.cards[cardI];
        await conn.execute(
          `INSERT INTO cards
            (id, column_id, title, description, color, priority, due_date, alert_minutes, position, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            card.id, col.id, card.title,
            card.description || '', card.color || '',
            card.priority || '', card.dueDate || '',
            card.alertMinutes || 30, cardI, card.createdAt,
          ]
        );

        for (let itemI = 0; itemI < card.checklist.length; itemI++) {
          const item = card.checklist[itemI];
          await conn.execute(
            'INSERT INTO checklist_items (id, card_id, text, done, position) VALUES (?, ?, ?, ?, ?)',
            [item.id, card.id, item.text, item.done ? 1 : 0, itemI]
          );
        }

        for (const comment of card.comments || []) {
          await conn.execute(
            'INSERT INTO comments (id, card_id, text, created_at) VALUES (?, ?, ?, ?)',
            [comment.id, card.id, comment.text, comment.createdAt]
          );
        }
      }
    }

    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error('PUT /boards/:id:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
});

// DELETE /api/boards/:id — exclui um quadro
router.delete('/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT created_by FROM boards WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Quadro não encontrado' });
    const board = rows[0];
    if (req.user.role !== 'admin' && board.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Sem permissão para excluir este quadro' });
    }
    await pool.execute('DELETE FROM boards WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /boards/:id:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
