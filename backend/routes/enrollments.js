const express = require('express');
const { db } = require('../database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// Get all enrollments
router.get('/', (req, res) => {
  const query = `
    SELECT e.*, s.name as student_name, c.name as course_name,
           sc.day_of_week, sc.start_time, sc.end_time
    FROM enrollments e
    JOIN students s ON e.student_id = s.id
    JOIN schedules sc ON e.schedule_id = sc.id
    JOIN courses c ON sc.course_id = c.id
    ORDER BY e.created_at DESC
  `;

  db.all(query, (err, enrollments) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(enrollments);
  });
});

// Get enrollment by ID
router.get('/:id', (req, res) => {
  const query = `
    SELECT e.*, s.name as student_name, c.name as course_name,
           sc.day_of_week, sc.start_time, sc.end_time
    FROM enrollments e
    JOIN students s ON e.student_id = s.id
    JOIN schedules sc ON e.schedule_id = sc.id
    JOIN courses c ON sc.course_id = c.id
    WHERE e.id = ?
  `;

  db.get(query, [req.params.id], (err, enrollment) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!enrollment) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }
    res.json(enrollment);
  });
});

// Create enrollment
router.post('/', (req, res) => {
  const { student_id, schedule_id, start_date, end_date, total_sessions } = req.body;

  db.run(
    'INSERT INTO enrollments (student_id, schedule_id, start_date, end_date, total_sessions, remaining_sessions) VALUES (?, ?, ?, ?, ?, ?)',
    [student_id, schedule_id, start_date, end_date, total_sessions, total_sessions],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({ id: this.lastID, message: 'Enrollment created successfully' });
    }
  );
});

// Update enrollment
router.put('/:id', (req, res) => {
  const { schedule_id, start_date, end_date, total_sessions, remaining_sessions, status } = req.body;

  db.run(
    'UPDATE enrollments SET schedule_id = ?, start_date = ?, end_date = ?, total_sessions = ?, remaining_sessions = ?, status = ? WHERE id = ?',
    [schedule_id, start_date, end_date, total_sessions, remaining_sessions, status, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Enrollment not found' });
      }
      res.json({ message: 'Enrollment updated successfully' });
    }
  );
});

// Cancel enrollment
router.delete('/:id', (req, res) => {
  db.run('UPDATE enrollments SET status = ? WHERE id = ?', ['cancelled', req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }
    res.json({ message: 'Enrollment cancelled successfully' });
  });
});

module.exports = router;
