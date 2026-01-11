import { useState, useEffect } from 'react';
import { getStudents, createStudent, updateStudent, deleteStudent, getStudentAttendanceStats } from '../api';

function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    parent_phone: ''
  });

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const response = await getStudents();
      setStudents(response.data);
    } catch (error) {
      console.error('Failed to load students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedStudent) {
        await updateStudent(selectedStudent.id, formData);
      } else {
        await createStudent(formData);
      }
      setShowModal(false);
      resetForm();
      loadStudents();
    } catch (error) {
      console.error('Failed to save student:', error);
      alert('학생 정보 저장에 실패했습니다.');
    }
  };

  const handleEdit = (student) => {
    setSelectedStudent(student);
    setFormData({
      name: student.name,
      phone: student.phone || '',
      email: student.email || '',
      parent_phone: student.parent_phone || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      try {
        await deleteStudent(id);
        loadStudents();
      } catch (error) {
        console.error('Failed to delete student:', error);
        alert('학생 삭제에 실패했습니다.');
      }
    }
  };

  const handleViewStats = async (student) => {
    try {
      const response = await getStudentAttendanceStats(student.id);
      setAttendanceStats(response.data);
      setSelectedStudent(student);
      setShowStatsModal(true);
    } catch (error) {
      console.error('Failed to load attendance stats:', error);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', phone: '', email: '', parent_phone: '' });
    setSelectedStudent(null);
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>학생 관리</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          학생 추가
        </button>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>이름</th>
              <th>연락처</th>
              <th>이메일</th>
              <th>학부모 연락처</th>
              <th>등록일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td>{student.name}</td>
                <td>{student.phone || '-'}</td>
                <td>{student.email || '-'}</td>
                <td>{student.parent_phone || '-'}</td>
                <td>{new Date(student.created_at).toLocaleDateString('ko-KR')}</td>
                <td>
                  <button className="btn btn-secondary" style={{ marginRight: '5px' }} onClick={() => handleViewStats(student)}>
                    출석 현황
                  </button>
                  <button className="btn btn-primary" style={{ marginRight: '5px' }} onClick={() => handleEdit(student)}>
                    수정
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(student.id)}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{selectedStudent ? '학생 수정' : '학생 추가'}</h2>
              <button className="close-btn" onClick={() => { setShowModal(false); resetForm(); }}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>이름 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>연락처</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>이메일</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>학부모 연락처</label>
                <input
                  type="tel"
                  value={formData.parent_phone}
                  onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                />
              </div>
              <button type="submit" className="btn btn-primary">저장</button>
            </form>
          </div>
        </div>
      )}

      {showStatsModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{selectedStudent.name} - 출석 현황</h2>
              <button className="close-btn" onClick={() => setShowStatsModal(false)}>×</button>
            </div>
            {attendanceStats.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                등록된 수업이 없습니다.
              </p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>수업명</th>
                    <th>총 수업</th>
                    <th>참석</th>
                    <th>남은 수업</th>
                    <th>참석률</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceStats.map((stat) => (
                    <tr key={stat.enrollment_id}>
                      <td>{stat.course_name}</td>
                      <td>{stat.total_sessions}회</td>
                      <td>{stat.attended_sessions}회</td>
                      <td>{stat.remaining_sessions}회</td>
                      <td>
                        {stat.expected_sessions > 0
                          ? `${Math.round((stat.attended_sessions / stat.expected_sessions) * 100)}%`
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Students;
