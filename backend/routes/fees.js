const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/fees
router.get('/', (req, res) => {
  const fees = db.prepare(`
    SELECT f.*, s.first_name, s.last_name 
    FROM fees f 
    JOIN students s ON f.student_id = s.id
  `).all();
  res.json(fees);
});

// GET /api/fees/summary
router.get('/summary', (req, res) => {
  const total_collected = db.prepare('SELECT SUM(amount_paid) as total FROM fees').get().total || 0;
  const total_outstanding = db.prepare('SELECT SUM(balance) as total FROM fees').get().total || 0;
  const overdue_count = db.prepare("SELECT COUNT(*) as count FROM fees WHERE status = 'overdue'").get().count || 0;

  res.json({ total_collected, total_outstanding, overdue_count });
});

// PUT /api/fees/:id/pay
router.put('/:id/pay', (req, res) => {
  const amount = Number(req.body.amount || 0);
  if (amount <= 0) {
    return res.status(400).json({ error: 'Amount must be greater than zero' });
  }
  const fee = db.prepare('SELECT * FROM fees WHERE id = ?').get(req.params.id);

  if (fee) {
    const new_paid = Math.min(fee.amount_paid + amount, fee.total_fee);
    const new_balance = Math.max(fee.total_fee - new_paid, 0);
    let status = 'partial';
    if (new_balance <= 0) status = 'paid';
    else if (new Date(fee.due_date) < new Date()) status = 'overdue';

    db.prepare('UPDATE fees SET amount_paid = ?, balance = ?, status = ? WHERE id = ?')
      .run(new_paid, new_balance, status, req.params.id);

    // Update student balance too
    db.prepare('UPDATE students SET fee_balance = ? WHERE id = ?')
      .run(new_balance, fee.student_id);

    res.json({ message: 'Payment recorded', new_paid, new_balance, status });
  } else {
    res.status(404).json({ error: 'Fee record not found' });
  }
});

module.exports = router;
