const express = require('express');
const { db } = require('../database');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// Get all payments
router.get('/', (req, res) => {
  const { student_id, start_date, end_date } = req.query;
  let query = `
    SELECT p.*, s.name as student_name, c.name as course_name
    FROM payments p
    JOIN students s ON p.student_id = s.id
    LEFT JOIN enrollments e ON p.enrollment_id = e.id
    LEFT JOIN schedules sc ON e.schedule_id = sc.id
    LEFT JOIN courses c ON sc.course_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (student_id) {
    query += ' AND p.student_id = ?';
    params.push(student_id);
  }

  if (start_date) {
    query += ' AND DATE(p.payment_date) >= ?';
    params.push(start_date);
  }

  if (end_date) {
    query += ' AND DATE(p.payment_date) <= ?';
    params.push(end_date);
  }

  query += ' ORDER BY p.payment_date DESC';

  db.all(query, params, (err, payments) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(payments);
  });
});

// Get payment by ID
router.get('/:id', (req, res) => {
  const query = `
    SELECT p.*, s.name as student_name, s.phone,
           c.name as course_name, e.total_sessions
    FROM payments p
    JOIN students s ON p.student_id = s.id
    LEFT JOIN enrollments e ON p.enrollment_id = e.id
    LEFT JOIN schedules sc ON e.schedule_id = sc.id
    LEFT JOIN courses c ON sc.course_id = c.id
    WHERE p.id = ?
  `;

  db.get(query, [req.params.id], (err, payment) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json(payment);
  });
});

// Create payment
router.post('/', (req, res) => {
  const { student_id, enrollment_id, amount, payment_method, description } = req.body;

  db.run(
    'INSERT INTO payments (student_id, enrollment_id, amount, payment_method, description, status) VALUES (?, ?, ?, ?, ?, ?)',
    [student_id, enrollment_id, amount, payment_method, description, 'completed'],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.status(201).json({
        id: this.lastID,
        message: 'Payment recorded successfully'
      });
    }
  );
});

// Update payment status
router.put('/:id', (req, res) => {
  const { status, description } = req.body;

  db.run(
    'UPDATE payments SET status = ?, description = ? WHERE id = ?',
    [status, description, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Payment not found' });
      }
      res.json({ message: 'Payment updated successfully' });
    }
  );
});

// Get payment statistics
router.get('/stats/summary', (req, res) => {
  const { start_date, end_date } = req.query;
  let query = `
    SELECT
      COUNT(*) as total_payments,
      SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_revenue,
      SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount,
      SUM(CASE WHEN status = 'refunded' THEN amount ELSE 0 END) as refunded_amount
    FROM payments
    WHERE 1=1
  `;
  const params = [];

  if (start_date) {
    query += ' AND DATE(payment_date) >= ?';
    params.push(start_date);
  }

  if (end_date) {
    query += ' AND DATE(payment_date) <= ?';
    params.push(end_date);
  }

  db.get(query, params, (err, stats) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(stats);
  });
});

module.exports = router;
