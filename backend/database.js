const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Initialize database schema
const initDatabase = () => {
  db.serialize(() => {
    // Users table (admin, teachers)
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'teacher')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Students table
    db.run(`
      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        parent_phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Courses table
    db.run(`
      CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        teacher_id INTEGER,
        description TEXT,
        max_students INTEGER DEFAULT 10,
        duration_minutes INTEGER DEFAULT 60,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES users(id)
      )
    `);

    // Schedules table (recurring class schedules)
    db.run(`
      CREATE TABLE IF NOT EXISTS schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL,
        day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        room TEXT,
        active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(id)
      )
    `);

    // Enrollments table (student course registrations)
    db.run(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        schedule_id INTEGER NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE,
        total_sessions INTEGER NOT NULL,
        remaining_sessions INTEGER NOT NULL,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'cancelled')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (schedule_id) REFERENCES schedules(id)
      )
    `);

    // Attendance table (check-in/out records)
    db.run(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        enrollment_id INTEGER NOT NULL,
        check_in_time DATETIME NOT NULL,
        check_out_time DATETIME,
        date DATE NOT NULL,
        status TEXT DEFAULT 'present' CHECK(status IN ('present', 'absent', 'late')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (enrollment_id) REFERENCES enrollments(id)
      )
    `);

    // Payments table
    db.run(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        enrollment_id INTEGER,
        amount DECIMAL(10, 2) NOT NULL,
        payment_method TEXT CHECK(payment_method IN ('cash', 'card', 'transfer')),
        payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'completed' CHECK(status IN ('pending', 'completed', 'refunded')),
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (enrollment_id) REFERENCES enrollments(id)
      )
    `);

    // Schedule change requests table
    db.run(`
      CREATE TABLE IF NOT EXISTS schedule_change_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        current_schedule_id INTEGER NOT NULL,
        requested_schedule_id INTEGER NOT NULL,
        reason TEXT,
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
        admin_notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        processed_at DATETIME,
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (current_schedule_id) REFERENCES schedules(id),
        FOREIGN KEY (requested_schedule_id) REFERENCES schedules(id)
      )
    `);

    console.log('Database initialized successfully');
  });
};

module.exports = { db, initDatabase };
