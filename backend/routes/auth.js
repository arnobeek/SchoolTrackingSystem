const express = require('express');
const router = express.Router();
const db = require('../db/database');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password);

  if (user) {
    // In a real app, we'd use JWT here. For demo, just returning user info.
    const teacher = db.prepare('SELECT id FROM teachers WHERE user_id = ?').get(user.id);
    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      teacher_id: teacher?.id || null
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

module.exports = router;
