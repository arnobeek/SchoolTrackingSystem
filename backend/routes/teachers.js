const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/teachers - list all teachers with attendance summary
router.get('/', (req, res) => {
  const { from, to } = req.query;
  const useRange = Boolean(from && to);
  const dateFilter = useRange ? ' AND date BETWEEN ? AND ?' : '';
  const rangeParams = useRange ? [from, to] : [];

  const teachers = db.prepare(`
    SELECT t.*, 
    (SELECT COUNT(*) FROM attendance WHERE teacher_id = t.id AND status = 'present'${dateFilter}) as present_count,
    (SELECT COUNT(*) FROM attendance WHERE teacher_id = t.id AND status = 'absent'${dateFilter}) as absent_count,
    (SELECT COUNT(*) FROM attendance WHERE teacher_id = t.id AND status = 'late'${dateFilter}) as late_count,
    (SELECT COUNT(*) FROM attendance WHERE teacher_id = t.id AND check_out_time IS NULL AND check_in_time IS NOT NULL${dateFilter}) as missing_clock_out_count
    FROM teachers t
  `).all(...rangeParams, ...rangeParams, ...rangeParams, ...rangeParams);
  res.json(teachers);
});

// GET /api/teachers/:id - single teacher detail
router.get('/:id', (req, res) => {
  const teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(req.params.id);
  if (teacher) {
    res.json(teacher);
  } else {
    res.status(404).json({ error: 'Teacher not found' });
  }
});

module.exports = router;
