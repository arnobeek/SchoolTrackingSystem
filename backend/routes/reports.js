const express = require('express');
const router = express.Router();
const db = require('../db/database');

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function sendCsv(res, filename, headers, rows) {
  const content = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')),
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(content);
}

function getAttendanceFilters(query) {
  const today = new Date();
  const to = query.to || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const fromDate = new Date(today);
  fromDate.setDate(fromDate.getDate() - 13);
  const from = query.from || `${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(2, '0')}-${String(fromDate.getDate()).padStart(2, '0')}`;

  return {
    from,
    to,
    teacherId: query.teacherId ? Number(query.teacherId) : null,
  };
}

function getAttendanceReport(filters) {
  const clauses = ['a.date BETWEEN ? AND ?'];
  const params = [filters.from, filters.to];
  if (filters.teacherId) {
    clauses.push('a.teacher_id = ?');
    params.push(filters.teacherId);
  }
  const whereClause = clauses.join(' AND ');

  const chart = db.prepare(`
    SELECT
      a.date,
      COUNT(CASE WHEN a.status = 'present' THEN 1 END) AS present,
      COUNT(CASE WHEN a.status = 'late' THEN 1 END) AS late,
      COUNT(CASE WHEN a.status = 'absent' THEN 1 END) AS absent
    FROM attendance a
    WHERE ${whereClause}
    GROUP BY a.date
    ORDER BY a.date ASC
  `).all(...params);

  const rows = db.prepare(`
    SELECT
      t.first_name || ' ' || t.last_name AS teacher_name,
      t.subject,
      COUNT(*) AS total_days,
      COUNT(CASE WHEN a.status = 'present' THEN 1 END) AS present_days,
      COUNT(CASE WHEN a.status = 'late' THEN 1 END) AS late_days,
      COUNT(CASE WHEN a.status = 'absent' THEN 1 END) AS absent_days,
      COUNT(CASE WHEN a.check_in_time IS NOT NULL AND a.check_out_time IS NULL THEN 1 END) AS missing_clock_outs,
      ROUND((COUNT(CASE WHEN a.status IN ('present', 'late') THEN 1 END) * 100.0) / COUNT(*), 1) AS attendance_rate
    FROM attendance a
    JOIN teachers t ON t.id = a.teacher_id
    WHERE ${whereClause}
    GROUP BY t.id, t.first_name, t.last_name, t.subject
    ORDER BY attendance_rate DESC, teacher_name ASC
  `).all(...params);

  const summaryRow = db.prepare(`
    SELECT
      COUNT(*) AS total_records,
      COUNT(CASE WHEN status = 'present' THEN 1 END) AS present_count,
      COUNT(CASE WHEN status = 'late' THEN 1 END) AS late_count,
      COUNT(CASE WHEN status = 'absent' THEN 1 END) AS absent_count,
      COUNT(CASE WHEN check_in_time IS NOT NULL AND check_out_time IS NULL THEN 1 END) AS missing_clock_outs
    FROM attendance a
    WHERE ${whereClause}
  `).get(...params);

  const attendanceRate = summaryRow.total_records > 0
    ? Math.round(((summaryRow.present_count + summaryRow.late_count) / summaryRow.total_records) * 100)
    : 0;

  return {
    filters,
    summary: {
      total_records: summaryRow.total_records,
      present_count: summaryRow.present_count,
      late_count: summaryRow.late_count,
      absent_count: summaryRow.absent_count,
      missing_clock_outs: summaryRow.missing_clock_outs,
      attendance_rate: attendanceRate,
    },
    chart,
    rows,
  };
}

function getPerformanceReport(filters) {
  const clauses = ['1=1'];
  const params = [];
  if (filters.term) {
    clauses.push('e.term = ?');
    params.push(filters.term);
  }
  if (filters.year) {
    clauses.push('e.year = ?');
    params.push(Number(filters.year));
  }
  if (filters.classId) {
    clauses.push('c.id = ?');
    params.push(Number(filters.classId));
  }
  if (filters.subject) {
    clauses.push('r.subject = ?');
    params.push(filters.subject);
  }
  const whereClause = clauses.join(' AND ');

  const rows = db.prepare(`
    SELECT
      c.class_name,
      e.term,
      e.year,
      r.subject,
      ROUND(AVG(r.marks), 1) AS average_marks,
      MAX(r.marks) AS highest_marks,
      MIN(r.marks) AS lowest_marks,
      COUNT(*) AS entries,
      ROUND((COUNT(CASE WHEN r.marks >= 50 THEN 1 END) * 100.0) / COUNT(*), 1) AS pass_rate
    FROM results r
    JOIN students s ON s.id = r.student_id
    JOIN classes c ON c.id = s.class_id
    JOIN exams e ON e.id = r.exam_id
    WHERE ${whereClause}
    GROUP BY c.class_name, e.term, e.year, r.subject
    ORDER BY average_marks DESC, c.class_name ASC
  `).all(...params);

  const chart = db.prepare(`
    SELECT
      c.class_name,
      ROUND(AVG(r.marks), 1) AS average_marks
    FROM results r
    JOIN students s ON s.id = r.student_id
    JOIN classes c ON c.id = s.class_id
    JOIN exams e ON e.id = r.exam_id
    WHERE ${whereClause}
    GROUP BY c.class_name
    ORDER BY average_marks DESC
  `).all(...params);

  const summaryRow = db.prepare(`
    SELECT
      ROUND(AVG(r.marks), 1) AS school_average,
      MAX(r.marks) AS highest_marks,
      MIN(r.marks) AS lowest_marks,
      COUNT(*) AS entries,
      ROUND((COUNT(CASE WHEN r.marks >= 50 THEN 1 END) * 100.0) / COUNT(*), 1) AS pass_rate
    FROM results r
    JOIN students s ON s.id = r.student_id
    JOIN classes c ON c.id = s.class_id
    JOIN exams e ON e.id = r.exam_id
    WHERE ${whereClause}
  `).get(...params);

  return {
    filters,
    summary: summaryRow,
    chart,
    rows,
  };
}

function getFeesReport(filters) {
  const clauses = ['1=1'];
  const params = [];
  if (filters.status) {
    clauses.push('f.status = ?');
    params.push(filters.status);
  }
  if (filters.dueBefore) {
    clauses.push('f.due_date <= ?');
    params.push(filters.dueBefore);
  }
  if (filters.classId) {
    clauses.push('c.id = ?');
    params.push(Number(filters.classId));
  }
  const whereClause = clauses.join(' AND ');

  const rows = db.prepare(`
    SELECT
      s.first_name || ' ' || s.last_name AS student_name,
      c.class_name,
      f.total_fee,
      f.amount_paid,
      f.balance,
      f.status,
      f.due_date
    FROM fees f
    JOIN students s ON s.id = f.student_id
    JOIN classes c ON c.id = s.class_id
    WHERE ${whereClause}
    ORDER BY f.balance DESC, f.due_date ASC
  `).all(...params);

  const chart = db.prepare(`
    SELECT
      f.status,
      COUNT(*) AS count,
      SUM(f.balance) AS total_balance
    FROM fees f
    JOIN students s ON s.id = f.student_id
    JOIN classes c ON c.id = s.class_id
    WHERE ${whereClause}
    GROUP BY f.status
  `).all(...params);

  const summaryRow = db.prepare(`
    SELECT
      SUM(f.amount_paid) AS total_collected,
      SUM(f.balance) AS total_outstanding,
      COUNT(CASE WHEN f.status = 'overdue' THEN 1 END) AS overdue_count,
      COUNT(*) AS records
    FROM fees f
    JOIN students s ON s.id = f.student_id
    JOIN classes c ON c.id = s.class_id
    WHERE ${whereClause}
  `).get(...params);

  return {
    filters,
    summary: {
      total_collected: summaryRow.total_collected || 0,
      total_outstanding: summaryRow.total_outstanding || 0,
      overdue_count: summaryRow.overdue_count || 0,
      records: summaryRow.records || 0,
    },
    chart,
    rows,
  };
}

// GET /api/reports/attendance
router.get('/attendance', (req, res) => {
  res.json(getAttendanceReport(getAttendanceFilters(req.query)));
});

// GET /api/reports/performance
router.get('/performance', (req, res) => {
  res.json(getPerformanceReport({
    term: req.query.term || '',
    year: req.query.year || '',
    classId: req.query.classId || '',
    subject: req.query.subject || '',
  }));
});

// GET /api/reports/fees
router.get('/fees', (req, res) => {
  res.json(getFeesReport({
    status: req.query.status || '',
    dueBefore: req.query.dueBefore || '',
    classId: req.query.classId || '',
  }));
});

router.get('/attendance/export', (req, res) => {
  const report = getAttendanceReport(getAttendanceFilters(req.query));
  sendCsv(res, 'attendance-report.csv', [
    'teacher_name',
    'subject',
    'total_days',
    'present_days',
    'late_days',
    'absent_days',
    'missing_clock_outs',
    'attendance_rate',
  ], report.rows);
});

router.get('/performance/export', (req, res) => {
  const report = getPerformanceReport({
    term: req.query.term || '',
    year: req.query.year || '',
    classId: req.query.classId || '',
    subject: req.query.subject || '',
  });
  sendCsv(res, 'performance-report.csv', [
    'class_name',
    'term',
    'year',
    'subject',
    'average_marks',
    'highest_marks',
    'lowest_marks',
    'entries',
    'pass_rate',
  ], report.rows);
});

router.get('/fees/export', (req, res) => {
  const report = getFeesReport({
    status: req.query.status || '',
    dueBefore: req.query.dueBefore || '',
    classId: req.query.classId || '',
  });
  sendCsv(res, 'fees-report.csv', [
    'student_name',
    'class_name',
    'total_fee',
    'amount_paid',
    'balance',
    'status',
    'due_date',
  ], report.rows);
});

module.exports = router;
