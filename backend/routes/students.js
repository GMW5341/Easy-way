const express = require('express');
const { db } = require('../database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// Get all students
router.get('/', (req, res) => {
  db.all('SELECT * FROM students ORDER BY created_at DESC', (err, students) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(students);
  });
});

// Get student by ID
router.get('/:id', (req, res) => {
  db.get('SELECT * FROM students WHERE id = ?', [req.params.id], (err, student) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(student);
  });
});

// Get student attendance stats
router.get('/:id/attendance-stats', (req, res) => {
  const query = `
    SELECT
      e.id as enrollment_id,
      c.name as course_name,
      e.total_sessions,
      e.remaining_sessions,
      COUNT(CASE WHEN a.status = 'present' THEN 1 END) as attended_sessions,
      e.total_sessions - e.remaining_sessions as expected_sessions
    FROM enrollments e
    JOIN schedules s ON e.schedule_id = s.id
    JOIN courses c ON s.course_id = c.id
    LEFT JOIN attendance a ON a.enrollment_id = e.id
    WHERE e.student_id = ? AND e.status = 'active'
    GROUP BY e.id
  `;

  db.all(query, [req.params.id], (err, stats) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(stats);
  });
});

// Create student
router.post('/', (req, res) => {
  const { name, phone, email, parent_phone } = req.body;

  db.run(
    'INSERT INTO students (name, phone, email, parent_phone) VALUES (?, ?, ?, ?)',
    [name, phone, email, parent_phone],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({ id: this.lastID, message: 'Student created successfully' });
    }
  );
});

// Update student
router.put('/:id', (req, res) => {
  const { name, phone, email, parent_phone } = req.body;

  db.run(
    'UPDATE students SET name = ?, phone = ?, email = ?, parent_phone = ? WHERE id = ?',
    [name, phone, email, parent_phone, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Student not found' });
      }
      res.json({ message: 'Student updated successfully' });
    }
  );
});

// Delete student
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM students WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json({ message: 'Student deleted successfully' });
  });
});

module.exports = router;
