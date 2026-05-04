const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/notifications
router.get('/', (req, res) => {
  const { user_id, is_read } = req.query;
  let query = 'SELECT * FROM notifications WHERE 1=1';
  const params = [];

  if (user_id) {
    query += ' AND user_id = ?';
    params.push(user_id);
  }
  if (is_read !== undefined) {
    query += ' AND is_read = ?';
    params.push(is_read === 'true' ? 1 : 0);
  }

  query += ' ORDER BY sent_at DESC';
  const notifications = db.prepare(query).all(params);
  res.json(notifications);
});

// PUT /api/notifications/:id/read
router.put('/:id/read', (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id);
  res.json({ message: 'Marked as read' });
});

module.exports = router;
