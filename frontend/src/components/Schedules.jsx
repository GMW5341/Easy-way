import { useState, useEffect } from 'react';
import { getSchedules, getCourses, createSchedule, updateSchedule, deleteSchedule, getScheduleStudents } from '../api';

const DAYS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

function Schedules() {
  const [schedules, setSchedules] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [formData, setFormData] = useState({
    course_id: '',
    day_of_week: 1,
    start_time: '09:00',
    end_time: '10:00',
    room: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [schedulesRes, coursesRes] = await Promise.all([
        getSchedules(),
        getCourses()
      ]);
      setSchedules(schedulesRes.data);
      setCourses(coursesRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedSchedule) {
        await updateSchedule(selectedSchedule.id, formData);
      } else {
        await createSchedule(formData);
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to save schedule:', error);
      alert('스케줄 저장에 실패했습니다.');
    }
  };

  const handleEdit = (schedule) => {
    setSelectedSchedule(schedule);
    setFormData({
      course_id: schedule.course_id,
      day_of_week: schedule.day_of_week,
      start_time: schedule.start_time,
      end_time: schedule.end_time,
      room: schedule.room || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      try {
        await deleteSchedule(id);
        loadData();
      } catch (error) {
        console.error('Failed to delete schedule:', error);
        alert('스케줄 삭제에 실패했습니다.');
      }
    }
  };

  const handleViewStudents = async (schedule) => {
    try {
      const response = await getScheduleStudents(schedule.id);
      setEnrolledStudents(response.data);
      setSelectedSchedule(schedule);
      setShowStudentsModal(true);
    } catch (error) {
      console.error('Failed to load students:', error);
    }
  };

  const resetForm = () => {
    setFormData({ course_id: '', day_of_week: 1, start_time: '09:00', end_time: '10:00', room: '' });
    setSelectedSchedule(null);
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>스케줄 관리</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          스케줄 추가
        </button>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>수업명</th>
              <th>요일</th>
              <th>시작 시간</th>
              <th>종료 시간</th>
              <th>강의실</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((schedule) => (
              <tr key={schedule.id}>
                <td>{schedule.course_name}</td>
                <td>{DAYS[schedule.day_of_week]}</td>
                <td>{schedule.start_time}</td>
                <td>{schedule.end_time}</td>
                <td>{schedule.room || '-'}</td>
                <td>
                  <button className="btn btn-secondary" style={{ marginRight: '5px' }} onClick={() => handleViewStudents(schedule)}>
                    수강생 보기
                  </button>
                  <button className="btn btn-primary" style={{ marginRight: '5px' }} onClick={() => handleEdit(schedule)}>
                    수정
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDelete(schedule.id)}>
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
              <h2>{selectedSchedule ? '스케줄 수정' : '스케줄 추가'}</h2>
              <button className="close-btn" onClick={() => { setShowModal(false); resetForm(); }}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>수업 *</label>
                <select
                  value={formData.course_id}
                  onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                  required
                >
                  <option value="">선택하세요</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>{course.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>요일 *</label>
                <select
                  value={formData.day_of_week}
                  onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
                  required
                >
                  {DAYS.map((day, index) => (
                    <option key={index} value={index}>{day}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>시작 시간 *</label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>종료 시간 *</label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>강의실</label>
                <input
                  type="text"
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                />
              </div>
              <button type="submit" className="btn btn-primary">저장</button>
            </form>
          </div>
        </div>
      )}

      {showStudentsModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{selectedSchedule.course_name} - 수강생 목록</h2>
              <button className="close-btn" onClick={() => setShowStudentsModal(false)}>×</button>
            </div>
            {enrolledStudents.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                등록된 학생이 없습니다.
              </p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>학생명</th>
                    <th>등록일</th>
                    <th>총 수업</th>
                    <th>남은 수업</th>
                    <th>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {enrolledStudents.map((student) => (
                    <tr key={student.enrollment_id}>
                      <td>{student.name}</td>
                      <td>{new Date(student.start_date).toLocaleDateString('ko-KR')}</td>
                      <td>{student.total_sessions}회</td>
                      <td>{student.remaining_sessions}회</td>
                      <td>
                        {student.status === 'active' && <span className="badge badge-success">진행 중</span>}
                        {student.status === 'completed' && <span className="badge badge-info">완료</span>}
                        {student.status === 'cancelled' && <span className="badge badge-danger">취소</span>}
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

export default Schedules;
