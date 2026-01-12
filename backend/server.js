require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { initDatabase, ensureAdminUser } = require('./database');

// Import routes
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const courseRoutes = require('./routes/courses');
const scheduleRoutes = require('./routes/schedules');
const enrollmentRoutes = require('./routes/enrollments');
const attendanceRoutes = require('./routes/attendance');
const paymentRoutes = require('./routes/payments');
const scheduleChangeRoutes = require('./routes/schedule-changes');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize database
initDatabase(); 
const bcrypt = require('bcrypt');
const { db } = require('./database');

(async () => {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return;

  const hashed = await bcrypt.hash(adminPassword, 10);

  db.run(
    `
    INSERT INTO users (username, password, name, role)
    VALUES ('admin', ?, '관리자', 'admin')
    ON CONFLICT(username)
    DO UPDATE SET password=excluded.password
    `,
    [hashed]
  );
})();
ensureAdminUser();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/schedule-changes', scheduleChangeRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Academy Management System API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API: http://localhost:${PORT}/api`);
});
