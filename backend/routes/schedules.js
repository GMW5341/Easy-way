const express = require('express');
const { db } = require('../database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// Get all schedules
router.get('/', (req, res) => {
  const query = `
    SELECT s.*, c.name as course_name, c.teacher_id, u.name as teacher_name
    FROM schedules s
    JOIN courses c ON s.course_id = c.id
    LEFT JOIN users u ON c.teacher_id = u.id
    WHERE s.active = 1
    ORDER BY s.day_of_week, s.start_time
  `;

  db.all(query, (err, schedules) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(schedules);
  });
});

// Get schedule by ID
router.get('/:id', (req, res) => {
  const query = `
    SELECT s.*, c.name as course_name, c.teacher_id, u.name as teacher_name,
           c.max_students, c.duration_minutes
    FROM schedules s
    JOIN courses c ON s.course_id = c.id
    LEFT JOIN users u ON c.teacher_id = u.id
    WHERE s.id = ?
  `;

  db.get(query, [req.params.id], (err, schedule) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    res.json(schedule);
  });
});

// Get enrolled students for a schedule
router.get('/:id/students', (req, res) => {
  const query = `
    SELECT s.*, e.id as enrollment_id, e.start_date, e.end_date,
           e.total_sessions, e.remaining_sessions, e.status
    FROM students s
    JOIN enrollments e ON s.id = e.student_id
    WHERE e.schedule_id = ? AND e.status = 'active'
    ORDER BY s.name
  `;

  db.all(query, [req.params.id], (err, students) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(students);
  });
});

// Create schedule
router.post('/', (req, res) => {
  const { course_id, day_of_week, start_time, end_time, room } = req.body;

  db.run(
    'INSERT INTO schedules (course_id, day_of_week, start_time, end_time, room) VALUES (?, ?, ?, ?, ?)',
    [course_id, day_of_week, start_time, end_time, room],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({ id: this.lastID, message: 'Schedule created successfully' });
    }
  );
});

// Update schedule
router.put('/:id', (req, res) => {
  const { course_id, day_of_week, start_time, end_time, room, active } = req.body;

  db.run(
    'UPDATE schedules SET course_id = ?, day_of_week = ?, start_time = ?, end_time = ?, room = ?, active = ? WHERE id = ?',
    [course_id, day_of_week, start_time, end_time, room, active !== undefined ? active : 1, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Schedule not found' });
      }
      res.json({ message: 'Schedule updated successfully' });
    }
  );
});

// Delete schedule
router.delete('/:id', (req, res) => {
  db.run('UPDATE schedules SET active = 0 WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    res.json({ message: 'Schedule deactivated successfully' });
  });
});

module.exports = router;
