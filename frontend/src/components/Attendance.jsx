import { useState, useEffect } from 'react';
import { getTodayAttendance, checkIn, checkOut, getStudents, getEnrollments } from '../api';

function Attendance() {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedEnrollment, setSelectedEnrollment] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [attendanceRes, studentsRes, enrollmentsRes] = await Promise.all([
        getTodayAttendance(),
        getStudents(),
        getEnrollments()
      ]);
      setAttendanceRecords(attendanceRes.data);
      setStudents(studentsRes.data);
      setEnrollments(enrollmentsRes.data.filter(e => e.status === 'active'));
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    try {
      await checkIn({
        student_id: selectedStudent,
        enrollment_id: selectedEnrollment
      });
      setShowCheckInModal(false);
      setSelectedStudent('');
      setSelectedEnrollment('');
      loadData();
      alert('입실 처리가 완료되었습니다.');
    } catch (error) {
      console.error('Failed to check in:', error);
      alert(error.response?.data?.error || '입실 처리에 실패했습니다.');
    }
  };

  const handleCheckOut = async (studentId) => {
    if (confirm('퇴실 처리하시겠습니까?')) {
      try {
        await checkOut({ student_id: studentId });
        loadData();
        alert('퇴실 처리가 완료되었습니다.');
      } catch (error) {
        console.error('Failed to check out:', error);
        alert(error.response?.data?.error || '퇴실 처리에 실패했습니다.');
      }
    }
  };

  const getStudentEnrollments = () => {
    if (!selectedStudent) return [];
    return enrollments.filter(e => e.student_id == selectedStudent);
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>출결 관리</h2>
        <button className="btn btn-primary" onClick={() => setShowCheckInModal(true)}>
          입실 처리
        </button>
      </div>

      <div className="card">
        <h3>오늘 출석 현황 ({new Date().toLocaleDateString('ko-KR')})</h3>
        {attendanceRecords.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            오늘 출석한 학생이 없습니다.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>학생명</th>
                <th>연락처</th>
                <th>수업명</th>
                <th>입실 시간</th>
                <th>퇴실 시간</th>
                <th>남은 수업</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {attendanceRecords.map((record) => (
                <tr key={record.id}>
                  <td>{record.student_name}</td>
                  <td>{record.phone || '-'}</td>
                  <td>{record.course_name}</td>
                  <td>{new Date(record.check_in_time).toLocaleTimeString('ko-KR')}</td>
                  <td>
                    {record.check_out_time ? (
                      new Date(record.check_out_time).toLocaleTimeString('ko-KR')
                    ) : (
                      <span className="badge badge-info">수업 중</span>
                    )}
                  </td>
                  <td>{record.remaining_sessions}회</td>
                  <td>
                    {!record.check_out_time && (
                      <button
                        className="btn btn-success"
                        onClick={() => handleCheckOut(record.student_id)}
                      >
                        퇴실 처리
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCheckInModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>입실 처리</h2>
              <button className="close-btn" onClick={() => setShowCheckInModal(false)}>×</button>
            </div>
            <form onSubmit={handleCheckIn}>
              <div className="form-group">
                <label>학생 선택 *</label>
                <select
                  value={selectedStudent}
                  onChange={(e) => {
                    setSelectedStudent(e.target.value);
                    setSelectedEnrollment('');
                  }}
                  required
                >
                  <option value="">학생을 선택하세요</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} - {student.phone}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>수업 선택 *</label>
                <select
                  value={selectedEnrollment}
                  onChange={(e) => setSelectedEnrollment(e.target.value)}
                  required
                  disabled={!selectedStudent}
                >
                  <option value="">수업을 선택하세요</option>
                  {getStudentEnrollments().map((enrollment) => (
                    <option key={enrollment.id} value={enrollment.id}>
                      {enrollment.course_name} - 남은 수업: {enrollment.remaining_sessions}회
                    </option>
                  ))}
                </select>
              </div>
              <div className="alert alert-info">
                입실 시간은 자동으로 기록됩니다.
              </div>
              <button type="submit" className="btn btn-primary">입실 처리</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Attendance;
