const express = require('express');
const router = express.Router();
const db = require('../db/database');

const SCHOOL_START_HOUR = 8;

function pad(value) {
  return String(value).padStart(2, '0');
}

function getSchoolDateParts() {
  const now = new Date();
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  return { date, time };
}

function getTeacherName(teacher) {
  return `${teacher.first_name} ${teacher.last_name}`;
}

function getTodayRecords(today) {
  return db.prepare(`
    SELECT
      t.id AS teacher_id,
      t.first_name,
      t.last_name,
      t.subject,
      a.id,
      a.date,
      a.check_in_time,
      a.check_out_time,
      COALESCE(a.status, 'absent') AS status,
      COALESCE(a.gps_verified, 0) AS gps_verified,
      COALESCE(a.fingerprint_verified, 0) AS fingerprint_verified
    FROM teachers t
    LEFT JOIN attendance a
      ON a.teacher_id = t.id
      AND a.date = ?
    ORDER BY t.first_name, t.last_name
  `).all(today);
}

// GET /api/attendance/today
router.get('/today', (req, res) => {
  const { date: today } = getSchoolDateParts();
  const records = getTodayRecords(today);
  res.json(records);
});

// GET /api/attendance/summary
router.get('/summary', (req, res) => {
  const { date: today } = getSchoolDateParts();
  const records = getTodayRecords(today);
  const total = records.length;
  const present = records.filter((record) => record.status === 'present').length;
  const late = records.filter((record) => record.status === 'late').length;
  const absent = records.filter((record) => record.status === 'absent').length;
  const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
  const checkedOut = records.filter((record) => Boolean(record.check_out_time)).length;
  const missingClockOut = records.filter((record) => record.check_in_time && !record.check_out_time).length;

  res.json({ present, absent, late, total, rate, checkedOut, missingClockOut, date: today });
});

// GET /api/attendance/trends (last 14 days)
router.get('/trends', (req, res) => {
  const trends = db.prepare(`
    SELECT date, 
    COUNT(CASE WHEN status = 'present' THEN 1 END) as present,
    COUNT(CASE WHEN status = 'late' THEN 1 END) as late,
    COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent
    FROM attendance 
    GROUP BY date 
    ORDER BY date DESC 
    LIMIT 14
  `).all();
  res.json(trends.reverse());
});

// GET /api/attendance/teacher/:id
router.get('/teacher/:id', (req, res) => {
  const history = db.prepare('SELECT * FROM attendance WHERE teacher_id = ? ORDER BY date DESC').all(req.params.id);
  res.json(history);
});

// GET /api/attendance/status/:teacherId
router.get('/status/:teacherId', (req, res) => {
  const teacherId = Number(req.params.teacherId);
  if (!teacherId) {
    return res.status(400).json({ error: 'Valid teacher ID is required' });
  }

  const teacher = db.prepare('SELECT id, first_name, last_name FROM teachers WHERE id = ?').get(teacherId);
  if (!teacher) {
    return res.status(404).json({ error: 'Teacher not found' });
  }

  const { date: today } = getSchoolDateParts();
  const record = db.prepare(`
    SELECT id, teacher_id, date, check_in_time, check_out_time, status, gps_verified, fingerprint_verified
    FROM attendance
    WHERE teacher_id = ? AND date = ?
  `).get(teacherId, today);

  res.json({
    teacher_id: teacherId,
    teacher_name: getTeacherName(teacher),
    date: today,
    status: record?.status || 'absent',
    check_in_time: record?.check_in_time || null,
    check_out_time: record?.check_out_time || null,
    gps_verified: record?.gps_verified || 0,
    fingerprint_verified: record?.fingerprint_verified || 0,
    has_clocked_in: Boolean(record?.check_in_time),
    has_clocked_out: Boolean(record?.check_out_time),
  });
});

// POST /api/attendance/clockin
router.post('/clockin', (req, res) => {
  const teacherId = Number(req.body.teacher_id);
  const gpsVerified = req.body.gps_verified ? 1 : 0;
  const fingerprintVerified = req.body.fingerprint_verified ? 1 : 0;

  if (!teacherId) {
    return res.status(400).json({ error: 'A valid teacher account is required to clock in' });
  }

  const teacher = db.prepare('SELECT id, first_name, last_name FROM teachers WHERE id = ?').get(teacherId);
  if (!teacher) {
    return res.status(404).json({ error: 'Teacher not found' });
  }

  const { date: today, time } = getSchoolDateParts();
  const currentHour = Number(time.split(':')[0]);
  const status = currentHour < SCHOOL_START_HOUR ? 'present' : 'late';
  const existing = db.prepare(`
    SELECT id, check_in_time, check_out_time
    FROM attendance
    WHERE teacher_id = ? AND date = ?
  `).get(teacherId, today);

  if (existing?.check_in_time) {
    return res.status(409).json({
      error: 'This teacher has already clocked in for today',
      check_in_time: existing.check_in_time,
      check_out_time: existing.check_out_time,
    });
  }

  if (existing) {
    db.prepare(`
      UPDATE attendance
      SET check_in_time = ?, check_out_time = NULL, status = ?, gps_verified = ?, fingerprint_verified = ?
      WHERE id = ?
    `).run(time, status, gpsVerified, fingerprintVerified, existing.id);
  } else {
    db.prepare(`
      INSERT INTO attendance (teacher_id, date, check_in_time, check_out_time, status, gps_verified, fingerprint_verified)
      VALUES (?, ?, ?, NULL, ?, ?, ?)
    `).run(teacherId, today, time, status, gpsVerified, fingerprintVerified);
  }

  res.json({
    message: 'Clock-in recorded',
    action: 'clock_in',
    status,
    time,
    teacher_name: getTeacherName(teacher),
    gps_verified: gpsVerified,
    fingerprint_verified: fingerprintVerified,
  });
});

// POST /api/attendance/clockout
router.post('/clockout', (req, res) => {
  const teacherId = Number(req.body.teacher_id);
  if (!teacherId) {
    return res.status(400).json({ error: 'A valid teacher account is required to clock out' });
  }

  const teacher = db.prepare('SELECT id, first_name, last_name FROM teachers WHERE id = ?').get(teacherId);
  if (!teacher) {
    return res.status(404).json({ error: 'Teacher not found' });
  }

  const { date: today, time } = getSchoolDateParts();
  const existing = db.prepare(`
    SELECT id, check_in_time, check_out_time, status
    FROM attendance
    WHERE teacher_id = ? AND date = ?
  `).get(teacherId, today);

  if (!existing?.check_in_time) {
    return res.status(400).json({ error: 'Clock-in is required before clock-out' });
  }

  if (existing.check_out_time) {
    return res.status(409).json({
      error: 'This teacher has already clocked out for today',
      check_out_time: existing.check_out_time,
    });
  }

  db.prepare('UPDATE attendance SET check_out_time = ? WHERE id = ?').run(time, existing.id);

  res.json({
    message: 'Clock-out recorded',
    action: 'clock_out',
    status: existing.status,
    time,
    check_in_time: existing.check_in_time,
    teacher_name: getTeacherName(teacher),
  });
});

module.exports = router;
