const express = require('express');
const { db } = require('../database');
const { authMiddleware } = require('../middleware/auth');
const { optimizeScheduleChange } = require('../services/scheduler');
const router = express.Router();

router.use(authMiddleware);

// Get all schedule change requests
router.get('/', (req, res) => {
  const { status, student_id } = req.query;
  let query = `
    SELECT scr.*,
           s.name as student_name,
           c1.name as current_course_name,
           c2.name as requested_course_name,
           cs1.day_of_week as current_day,
           cs1.start_time as current_start_time,
           cs1.end_time as current_end_time,
           cs2.day_of_week as requested_day,
           cs2.start_time as requested_start_time,
           cs2.end_time as requested_end_time
    FROM schedule_change_requests scr
    JOIN students s ON scr.student_id = s.id
    JOIN schedules cs1 ON scr.current_schedule_id = cs1.id
    JOIN schedules cs2 ON scr.requested_schedule_id = cs2.id
    JOIN courses c1 ON cs1.course_id = c1.id
    JOIN courses c2 ON cs2.course_id = c2.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND scr.status = ?';
    params.push(status);
  }

  if (student_id) {
    query += ' AND scr.student_id = ?';
    params.push(student_id);
  }

  query += ' ORDER BY scr.created_at DESC';

  db.all(query, params, (err, requests) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(requests);
  });
});

// Create schedule change request with optimization
router.post('/', async (req, res) => {
  const { student_id, current_schedule_id, requested_schedule_id, reason } = req.body;

  try {
    // Check if the change is feasible using the optimization algorithm
    const feasibility = await optimizeScheduleChange(
      student_id,
      current_schedule_id,
      requested_schedule_id
    );

    db.run(
      'INSERT INTO schedule_change_requests (student_id, current_schedule_id, requested_schedule_id, reason, status) VALUES (?, ?, ?, ?, ?)',
      [student_id, current_schedule_id, requested_schedule_id, reason, 'pending'],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.status(201).json({
          id: this.lastID,
          message: 'Schedule change request created',
          feasibility
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Error processing schedule change request' });
  }
});

// Process schedule change request (approve/reject)
router.put('/:id', (req, res) => {
  const { status, admin_notes } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  db.get(
    'SELECT * FROM schedule_change_requests WHERE id = ?',
    [req.params.id],
    (err, request) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!request) {
        return res.status(404).json({ error: 'Request not found' });
      }

      db.run(
        'UPDATE schedule_change_requests SET status = ?, admin_notes = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, admin_notes, req.params.id],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          // If approved, update the enrollment
          if (status === 'approved') {
            db.run(
              'UPDATE enrollments SET schedule_id = ? WHERE student_id = ? AND schedule_id = ? AND status = ?',
              [request.requested_schedule_id, request.student_id, request.current_schedule_id, 'active'],
              (err) => {
                if (err) {
                  console.error('Error updating enrollment:', err);
                }
              }
            );
          }

          res.json({ message: 'Schedule change request processed successfully' });
        }
      );
    }
  );
});

// Check availability for schedule change
router.post('/check-availability', async (req, res) => {
  const { student_id, requested_schedule_id } = req.body;

  try {
    const query = `
      SELECT
        s.id,
        s.day_of_week,
        s.start_time,
        s.end_time,
        c.name as course_name,
        c.max_students,
        COUNT(e.id) as enrolled_count
      FROM schedules s
      JOIN courses c ON s.course_id = c.id
      LEFT JOIN enrollments e ON s.id = e.schedule_id AND e.status = 'active'
      WHERE s.id = ?
      GROUP BY s.id
    `;

    db.get(query, [requested_schedule_id], async (err, schedule) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!schedule) {
        return res.status(404).json({ error: 'Schedule not found' });
      }

      const available = schedule.enrolled_count < schedule.max_students;
      const optimization = await optimizeScheduleChange(student_id, null, requested_schedule_id);

      res.json({
        available,
        enrolled_count: schedule.enrolled_count,
        max_students: schedule.max_students,
        schedule,
        optimization
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Error checking availability' });
  }
});

module.exports = router;
