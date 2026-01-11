import { useState, useEffect } from 'react';
import { getPayments, createPayment, getPaymentStats, getStudents, getEnrollments } from '../api';

function Payments() {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    enrollment_id: '',
    amount: '',
    payment_method: 'card',
    description: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const thisMonth = new Date(new Date().setDate(1)).toISOString().split('T')[0];
      const [paymentsRes, statsRes, studentsRes, enrollmentsRes] = await Promise.all([
        getPayments(),
        getPaymentStats({ start_date: thisMonth }),
        getStudents(),
        getEnrollments()
      ]);
      setPayments(paymentsRes.data);
      setStats(statsRes.data);
      setStudents(studentsRes.data);
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
      await createPayment({
        ...formData,
        amount: parseFloat(formData.amount)
      });
      setShowModal(false);
      resetForm();
      loadData();
      alert('결제가 등록되었습니다.');
    } catch (error) {
      console.error('Failed to create payment:', error);
      alert('결제 등록에 실패했습니다.');
    }
  };

  const resetForm = () => {
    setFormData({
      student_id: '',
      enrollment_id: '',
      amount: '',
      payment_method: 'card',
      description: ''
    });
  };

  const getStudentEnrollments = () => {
    if (!formData.student_id) return [];
    return enrollments.filter(e => e.student_id == formData.student_id);
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>결제 관리</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          결제 등록
        </button>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>이번 달 총 매출</h3>
            <div className="value">₩{(stats.total_revenue || 0).toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <h3>결제 건수</h3>
            <div className="value">{stats.total_payments || 0}</div>
          </div>
          <div className="stat-card">
            <h3>대기 중 결제</h3>
            <div className="value">₩{(stats.pending_amount || 0).toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <h3>환불 금액</h3>
            <div className="value">₩{(stats.refunded_amount || 0).toLocaleString()}</div>
          </div>
        </div>
      )}

      <div className="card">
        <h3>결제 내역</h3>
        <table>
          <thead>
            <tr>
              <th>날짜</th>
              <th>학생명</th>
              <th>수업명</th>
              <th>금액</th>
              <th>결제 방법</th>
              <th>상태</th>
              <th>비고</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td>{new Date(payment.payment_date).toLocaleDateString('ko-KR')}</td>
                <td>{payment.student_name}</td>
                <td>{payment.course_name || '-'}</td>
                <td>₩{payment.amount.toLocaleString()}</td>
                <td>
                  {payment.payment_method === 'card' && '카드'}
                  {payment.payment_method === 'cash' && '현금'}
                  {payment.payment_method === 'transfer' && '계좌이체'}
                </td>
                <td>
                  {payment.status === 'completed' && <span className="badge badge-success">완료</span>}
                  {payment.status === 'pending' && <span className="badge badge-warning">대기</span>}
                  {payment.status === 'refunded' && <span className="badge badge-danger">환불</span>}
                </td>
                <td>{payment.description || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>결제 등록</h2>
              <button className="close-btn" onClick={() => { setShowModal(false); resetForm(); }}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>학생 선택 *</label>
                <select
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value, enrollment_id: '' })}
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
                <label>수업 선택</label>
                <select
                  value={formData.enrollment_id}
                  onChange={(e) => setFormData({ ...formData, enrollment_id: e.target.value })}
                  disabled={!formData.student_id}
                >
                  <option value="">선택 안함 (일반 결제)</option>
                  {getStudentEnrollments().map((enrollment) => (
                    <option key={enrollment.id} value={enrollment.id}>
                      {enrollment.course_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>금액 *</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  min="0"
                  step="1000"
                />
              </div>
              <div className="form-group">
                <label>결제 방법 *</label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  required
                >
                  <option value="card">카드</option>
                  <option value="cash">현금</option>
                  <option value="transfer">계좌이체</option>
                </select>
              </div>
              <div className="form-group">
                <label>비고</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  placeholder="결제 관련 메모"
                />
              </div>
              <button type="submit" className="btn btn-primary">등록</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Payments;
