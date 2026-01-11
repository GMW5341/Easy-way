const bcrypt = require('bcrypt');
const { db } = require('./database');

async function seed() {
  console.log('Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);

  db.serialize(async () => {
    // Admin user
    db.run(
      'INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)',
      ['admin', hashedPassword, '관리자', 'admin'],
      function(err) {
        if (err && !err.message.includes('UNIQUE')) {
          console.error('Error creating admin:', err);
        } else {
          console.log('Admin user created: username=admin, password=admin123');
        }
      }
    );

    // Sample students
    const students = [
      { name: '김철수', phone: '010-1234-5678', email: 'kim@example.com', parent_phone: '010-1111-1111' },
      { name: '이영희', phone: '010-2345-6789', email: 'lee@example.com', parent_phone: '010-2222-2222' },
      { name: '박민수', phone: '010-3456-7890', email: 'park@example.com', parent_phone: '010-3333-3333' },
      { name: '최지연', phone: '010-4567-8901', email: 'choi@example.com', parent_phone: '010-4444-4444' },
      { name: '정하늘', phone: '010-5678-9012', email: 'jung@example.com', parent_phone: '010-5555-5555' }
    ];

    students.forEach((student) => {
      db.run(
        'INSERT INTO students (name, phone, email, parent_phone) VALUES (?, ?, ?, ?)',
        [student.name, student.phone, student.email, student.parent_phone],
        function(err) {
          if (err) console.error('Error creating student:', err);
        }
      );
    });

    // Sample courses
    const courses = [
      { name: '수학 기초반', description: '초등 수학 기초 과정', max_students: 10, duration_minutes: 60 },
      { name: '영어 회화반', description: '초급 영어 회화', max_students: 8, duration_minutes: 90 },
      { name: '과학 실험반', description: '재미있는 과학 실험', max_students: 12, duration_minutes: 120 },
      { name: '프로그래밍 입문', description: 'Python 프로그래밍 기초', max_students: 15, duration_minutes: 90 }
    ];

    courses.forEach((course) => {
      db.run(
        'INSERT INTO courses (name, description, max_students, duration_minutes) VALUES (?, ?, ?, ?)',
        [course.name, course.description, course.max_students, course.duration_minutes],
        function(err) {
          if (err) console.error('Error creating course:', err);
        }
      );
    });

    // Sample schedules
    setTimeout(() => {
      const schedules = [
        { course_id: 1, day_of_week: 1, start_time: '09:00', end_time: '10:00', room: 'A101' },
        { course_id: 1, day_of_week: 3, start_time: '09:00', end_time: '10:00', room: 'A101' },
        { course_id: 2, day_of_week: 2, start_time: '14:00', end_time: '15:30', room: 'B201' },
        { course_id: 2, day_of_week: 4, start_time: '14:00', end_time: '15:30', room: 'B201' },
        { course_id: 3, day_of_week: 5, start_time: '10:00', end_time: '12:00', room: 'C301' },
        { course_id: 4, day_of_week: 6, start_time: '13:00', end_time: '14:30', room: 'D401' }
      ];

      schedules.forEach((schedule) => {
        db.run(
          'INSERT INTO schedules (course_id, day_of_week, start_time, end_time, room) VALUES (?, ?, ?, ?, ?)',
          [schedule.course_id, schedule.day_of_week, schedule.start_time, schedule.end_time, schedule.room],
          function(err) {
            if (err) console.error('Error creating schedule:', err);
          }
        );
      });

      // Sample enrollments
      setTimeout(() => {
        const enrollments = [
          { student_id: 1, schedule_id: 1, start_date: '2024-01-01', total_sessions: 40, remaining_sessions: 35 },
          { student_id: 2, schedule_id: 3, start_date: '2024-01-01', total_sessions: 30, remaining_sessions: 28 },
          { student_id: 3, schedule_id: 5, start_date: '2024-01-15', total_sessions: 20, remaining_sessions: 18 },
          { student_id: 4, schedule_id: 2, start_date: '2024-01-01', total_sessions: 40, remaining_sessions: 32 },
          { student_id: 5, schedule_id: 6, start_date: '2024-01-08', total_sessions: 25, remaining_sessions: 24 }
        ];

        enrollments.forEach((enrollment) => {
          db.run(
            'INSERT INTO enrollments (student_id, schedule_id, start_date, total_sessions, remaining_sessions) VALUES (?, ?, ?, ?, ?)',
            [enrollment.student_id, enrollment.schedule_id, enrollment.start_date, enrollment.total_sessions, enrollment.remaining_sessions],
            function(err) {
              if (err) console.error('Error creating enrollment:', err);
            }
          );
        });

        // Sample payments
        const payments = [
          { student_id: 1, enrollment_id: 1, amount: 400000, payment_method: 'card', description: '수학 기초반 1개월' },
          { student_id: 2, enrollment_id: 2, amount: 350000, payment_method: 'transfer', description: '영어 회화반 1개월' },
          { student_id: 3, enrollment_id: 3, amount: 300000, payment_method: 'cash', description: '과학 실험반 1개월' },
          { student_id: 4, enrollment_id: 4, amount: 400000, payment_method: 'card', description: '수학 기초반 1개월' },
          { student_id: 5, enrollment_id: 5, amount: 380000, payment_method: 'card', description: '프로그래밍 입문 1개월' }
        ];

        payments.forEach((payment) => {
          db.run(
            'INSERT INTO payments (student_id, enrollment_id, amount, payment_method, description) VALUES (?, ?, ?, ?, ?)',
            [payment.student_id, payment.enrollment_id, payment.amount, payment.payment_method, payment.description],
            function(err) {
              if (err) console.error('Error creating payment:', err);
            }
          );
        });

        console.log('Seed data created successfully!');
        setTimeout(() => process.exit(0), 1000);
      }, 500);
    }, 500);
  });
}

seed().catch(console.error);
