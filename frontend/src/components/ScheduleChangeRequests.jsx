import { useState, useEffect } from 'react';
import {
  getScheduleChangeRequests,
  createScheduleChangeRequest,
  processScheduleChangeRequest,
  checkScheduleAvailability,
  getStudents,
  getSchedules,
  getEnrollments
} from '../api';

const DAYS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

function ScheduleChangeRequests() {
  const [requests, setRequests] = useState([]);
  const [students, setStudents] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [formData, setFormData] = useState({
    student_id: '',
    current_schedule_id: '',
    requested_schedule_id: '',
    reason: ''
  });
  const [processData, setProcessData] = useState({
    status: 'approved',
    admin_notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [requestsRes, studentsRes, schedulesRes, enrollmentsRes] = await Promise.all([
        getScheduleChangeRequests(),
        getStudents(),
        getSchedules(),
        getEnrollments()
      ]);
      setRequests(requestsRes.data);
      setStudents(studentsRes.data);
      setSchedules(schedulesRes.data);
      setEnrollments(enrollmentsRes.data.filter(e => e.status === 'active'));
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await createScheduleChangeRequest(formData);
      setShowModal(false);
      resetForm();
      loadData();

      const feasibility = response.data.feasibility;
      if (feasibility.feasible) {
        alert('스케줄 변경 요청이 등록되었습니다. 변경이 가능합니다!');
      } else {
        let message = `스케줄 변경 요청이 등록되었습니다.\n\n사유: ${feasibility.reason}`;
        if (feasibility.alternatives && feasibility.alternatives.length > 0) {
          message += '\n\n추천 대안:';
          feasibility.alternatives.slice(0, 3).forEach((alt, i) => {
            message += `\n${i + 1}. ${DAYS[alt.day_of_week]} ${alt.start_time}-${alt.end_time}`;
          });
        }
        alert(message);
      }
    } catch (error) {
      console.error('Failed to create request:', error);
      alert('요청 등록에 실패했습니다.');
    }
  };

  const handleProcess = async (e) => {
    e.preventDefault();
    try {
      await processScheduleChangeRequest(selectedRequest.id, processData);
      setShowProcessModal(false);
      setSelectedRequest(null);
      setProcessData({ status: 'approved', admin_notes: '' });
      loadData();
      alert('요청이 처리되었습니다.');
    } catch (error) {
      console.error('Failed to process request:', error);
      alert('요청 처리에 실패했습니다.');
    }
  };

  const handleCheckAvailability = async () => {
    if (!formData.student_id || !formData.requested_schedule_id) {
      alert('학생과 희망 스케줄을 선택하세요.');
      return;
    }

    try {
      const response = await checkScheduleAvailability({
        student_id: formData.student_id,
        requested_schedule_id: formData.requested_schedule_id
      });
      setAvailability(response.data);
    } catch (error) {
      console.error('Failed to check availability:', error);
      alert('가능 여부 확인에 실패했습니다.');
    }
  };

  const getStudentEnrollments = () => {
    if (!formData.student_id) return [];
    return enrollments.filter(e => e.student_id == formData.student_id);
  };

  const resetForm = () => {
    setFormData({
      student_id: '',
      current_schedule_id: '',
      requested_schedule_id: '',
      reason: ''
    });
    setAvailability(null);
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>시간 변경 요청 관리</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          변경 요청 등록
        </button>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>학생명</th>
              <th>현재 수업</th>
              <th>현재 시간</th>
              <th>희망 수업</th>
              <th>희망 시간</th>
              <th>사유</th>
              <th>상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id}>
                <td>{request.student_name}</td>
                <td>{request.current_course_name}</td>
                <td>
                  {DAYS[request.current_day]} {request.current_start_time}-{request.current_end_time}
                </td>
                <td>{request.requested_course_name}</td>
                <td>
                  {DAYS[request.requested_day]} {request.requested_start_time}-{request.requested_end_time}
                </td>
                <td>{request.reason || '-'}</td>
                <td>
                  {request.status === 'pending' && <span className="badge badge-warning">대기 중</span>}
                  {request.status === 'approved' && <span className="badge badge-success">승인</span>}
                  {request.status === 'rejected' && <span className="badge badge-danger">거부</span>}
                </td>
                <td>
                  {request.status === 'pending' && (
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowProcessModal(true);
                      }}
                    >
                      처리
                    </button>
                  )}
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
              <h2>시간 변경 요청 등록</h2>
              <button className="close-btn" onClick={() => { setShowModal(false); resetForm(); }}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>학생 선택 *</label>
                <select
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value, current_schedule_id: '' })}
                  required
                >
                  <option value="">학생을 선택하세요</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>현재 수업 *</label>
                <select
                  value={formData.current_schedule_id}
                  onChange={(e) => setFormData({ ...formData, current_schedule_id: e.target.value })}
                  required
                  disabled={!formData.student_id}
                >
                  <option value="">현재 수업을 선택하세요</option>
                  {getStudentEnrollments().map((enrollment) => (
                    <option key={enrollment.schedule_id} value={enrollment.schedule_id}>
                      {enrollment.course_name} - {DAYS[enrollment.day_of_week]} {enrollment.start_time}-{enrollment.end_time}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>희망 스케줄 *</label>
                <select
                  value={formData.requested_schedule_id}
                  onChange={(e) => {
                    setFormData({ ...formData, requested_schedule_id: e.target.value });
                    setAvailability(null);
                  }}
                  required
                >
                  <option value="">희망 스케줄을 선택하세요</option>
                  {schedules.map((schedule) => (
                    <option key={schedule.id} value={schedule.id}>
                      {schedule.course_name} - {DAYS[schedule.day_of_week]} {schedule.start_time}-{schedule.end_time}
                    </option>
                  ))}
                </select>
              </div>

              {formData.student_id && formData.requested_schedule_id && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCheckAvailability}
                  style={{ marginBottom: '15px', width: '100%' }}
                >
                  변경 가능 여부 확인
                </button>
              )}

              {availability && (
                <div className={`alert ${availability.available ? 'alert-success' : 'alert-error'}`}>
                  {availability.available ? (
                    <>
                      ✓ 변경 가능합니다!
                      <br />
                      현재 {availability.enrolled_count}/{availability.max_students}명 등록
                    </>
                  ) : (
                    <>
                      ✗ 변경 불가능
                      <br />
                      {availability.optimization?.reason}
                      {availability.optimization?.alternatives?.length > 0 && (
                        <>
                          <br /><br />
                          <strong>추천 대안:</strong>
                          {availability.optimization.alternatives.slice(0, 3).map((alt, i) => (
                            <div key={i}>
                              {i + 1}. {alt.course_name} - {DAYS[alt.day_of_week]} {alt.start_time}-{alt.end_time}
                              {alt.has_conflict && ' (시간 충돌)'}
                            </div>
                          ))}
                        </>
                      )}
                    </>
                  )}
                </div>
              )}

              <div className="form-group">
                <label>사유</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows="3"
                  placeholder="변경 요청 사유를 입력하세요"
                />
              </div>
              <button type="submit" className="btn btn-primary">요청 등록</button>
            </form>
          </div>
        </div>
      )}

      {showProcessModal && selectedRequest && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>요청 처리</h2>
              <button className="close-btn" onClick={() => { setShowProcessModal(false); setSelectedRequest(null); }}>×</button>
            </div>
            <div style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '4px' }}>
              <strong>학생:</strong> {selectedRequest.student_name}<br />
              <strong>현재:</strong> {selectedRequest.current_course_name} - {DAYS[selectedRequest.current_day]} {selectedRequest.current_start_time}-{selectedRequest.current_end_time}<br />
              <strong>희망:</strong> {selectedRequest.requested_course_name} - {DAYS[selectedRequest.requested_day]} {selectedRequest.requested_start_time}-{selectedRequest.requested_end_time}<br />
              <strong>사유:</strong> {selectedRequest.reason || '-'}
            </div>
            <form onSubmit={handleProcess}>
              <div className="form-group">
                <label>처리 결과 *</label>
                <select
                  value={processData.status}
                  onChange={(e) => setProcessData({ ...processData, status: e.target.value })}
                  required
                >
                  <option value="approved">승인</option>
                  <option value="rejected">거부</option>
                </select>
              </div>
              <div className="form-group">
                <label>관리자 메모</label>
                <textarea
                  value={processData.admin_notes}
                  onChange={(e) => setProcessData({ ...processData, admin_notes: e.target.value })}
                  rows="3"
                  placeholder="처리 관련 메모"
                />
              </div>
              <button type="submit" className="btn btn-primary">처리 완료</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScheduleChangeRequests;
