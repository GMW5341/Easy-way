const express = require('express');
const { db } = require('../database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// Get all attendance records
router.get('/', (req, res) => {
  const { date, student_id } = req.query;
  let query = `
    SELECT a.*, s.name as student_name, c.name as course_name
    FROM attendance a
    JOIN students s ON a.student_id = s.id
    JOIN enrollments e ON a.enrollment_id = e.id
    JOIN schedules sc ON e.schedule_id = sc.id
    JOIN courses c ON sc.course_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (date) {
    query += ' AND a.date = ?';
    params.push(date);
  }

  if (student_id) {
    query += ' AND a.student_id = ?';
    params.push(student_id);
  }

  query += ' ORDER BY a.check_in_time DESC';

  db.all(query, params, (err, records) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(records);
  });
});

// Check-in (자동 출입 기록)
router.post('/check-in', (req, res) => {
  const { student_id, enrollment_id } = req.body;
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const check_in_time = now.toISOString();

  // Check if already checked in today
  db.get(
    'SELECT * FROM attendance WHERE student_id = ? AND date = ? AND check_out_time IS NULL',
    [student_id, date],
    (err, existing) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (existing) {
        return res.status(400).json({ error: 'Already checked in today' });
      }

      db.run(
        'INSERT INTO attendance (student_id, enrollment_id, check_in_time, date) VALUES (?, ?, ?, ?)',
        [student_id, enrollment_id, check_in_time, date],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          res.status(201).json({
            id: this.lastID,
            message: 'Check-in recorded successfully',
            check_in_time
          });
        }
      );
    }
  );
});

// Check-out
router.post('/check-out', (req, res) => {
  const { student_id } = req.body;
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const check_out_time = now.toISOString();

  db.run(
    'UPDATE attendance SET check_out_time = ? WHERE student_id = ? AND date = ? AND check_out_time IS NULL',
    [check_out_time, student_id, date],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(400).json({ error: 'No active check-in found' });
      }

      // Decrement remaining sessions
      db.run(
        `UPDATE enrollments SET remaining_sessions = remaining_sessions - 1
         WHERE id = (SELECT enrollment_id FROM attendance WHERE student_id = ? AND date = ?)`,
        [student_id, date],
        (err) => {
          if (err) {
            console.error('Error updating remaining sessions:', err);
          }
        }
      );

      res.json({ message: 'Check-out recorded successfully', check_out_time });
    }
  );
});

// Get today's attendance
router.get('/today', (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const query = `
    SELECT a.*, s.name as student_name, s.phone,
           c.name as course_name, e.remaining_sessions
    FROM attendance a
    JOIN students s ON a.student_id = s.id
    JOIN enrollments e ON a.enrollment_id = e.id
    JOIN schedules sc ON e.schedule_id = sc.id
    JOIN courses c ON sc.course_id = c.id
    WHERE a.date = ?
    ORDER BY a.check_in_time DESC
  `;

  db.all(query, [today], (err, records) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(records);
  });
});

module.exports = router;
