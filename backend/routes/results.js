const express = require('express');
const router = express.Router();
const db = require('../db/database');

// GET /api/results
router.get('/', (req, res) => {
  const { class_id, exam_id, term } = req.query;
  let query = `
    SELECT r.*, s.first_name, s.last_name, c.class_name, e.exam_name, e.term
    FROM results r
    JOIN students s ON r.student_id = s.id
    JOIN classes c ON s.class_id = c.id
    JOIN exams e ON r.exam_id = e.id
    WHERE 1=1
  `;
  const params = [];

  if (class_id) {
    query += ' AND s.class_id = ?';
    params.push(class_id);
  }
  if (exam_id) {
    query += ' AND r.exam_id = ?';
    params.push(exam_id);
  }
  if (term) {
    query += ' AND e.term = ?';
    params.push(term);
  }

  const results = db.prepare(query).all(params);
  res.json(results);
});

// GET /api/results/summary
router.get('/summary', (req, res) => {
  const summary = db.prepare(`
    SELECT c.class_name, r.subject, AVG(r.marks) as average_marks
    FROM results r
    JOIN students s ON r.student_id = s.id
    JOIN classes c ON s.class_id = c.id
    GROUP BY c.class_name, r.subject
  `).all();
  res.json(summary);
});

module.exports = router;
