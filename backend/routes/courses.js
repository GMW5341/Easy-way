const express = require('express');
const { db } = require('../database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// Get all courses
router.get('/', (req, res) => {
  const query = `
    SELECT c.*, u.name as teacher_name
    FROM courses c
    LEFT JOIN users u ON c.teacher_id = u.id
    ORDER BY c.created_at DESC
  `;

  db.all(query, (err, courses) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(courses);
  });
});

// Get course by ID
router.get('/:id', (req, res) => {
  const query = `
    SELECT c.*, u.name as teacher_name
    FROM courses c
    LEFT JOIN users u ON c.teacher_id = u.id
    WHERE c.id = ?
  `;

  db.get(query, [req.params.id], (err, course) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json(course);
  });
});

// Create course
router.post('/', (req, res) => {
  const { name, teacher_id, description, max_students, duration_minutes } = req.body;

  db.run(
    'INSERT INTO courses (name, teacher_id, description, max_students, duration_minutes) VALUES (?, ?, ?, ?, ?)',
    [name, teacher_id, description, max_students || 10, duration_minutes || 60],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({ id: this.lastID, message: 'Course created successfully' });
    }
  );
});

// Update course
router.put('/:id', (req, res) => {
  const { name, teacher_id, description, max_students, duration_minutes } = req.body;

  db.run(
    'UPDATE courses SET name = ?, teacher_id = ?, description = ?, max_students = ?, duration_minutes = ? WHERE id = ?',
    [name, teacher_id, description, max_students, duration_minutes, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Course not found' });
      }
      res.json({ message: 'Course updated successfully' });
    }
  );
});

// Delete course
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM courses WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json({ message: 'Course deleted successfully' });
  });
});

module.exports = router;
