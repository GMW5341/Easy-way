import { useState, useEffect } from 'react';
import { getStudents, getCourses, getTodayAttendance, getPaymentStats } from '../api';

function Dashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    todayAttendance: 0,
    monthlyRevenue: 0
  });
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [studentsRes, coursesRes, attendanceRes, paymentsRes] = await Promise.all([
        getStudents(),
        getCourses(),
        getTodayAttendance(),
        getPaymentStats({
          start_date: new Date(new Date().setDate(1)).toISOString().split('T')[0]
        })
      ]);

      setStats({
        totalStudents: studentsRes.data.length,
        totalCourses: coursesRes.data.length,
        todayAttendance: attendanceRes.data.length,
        monthlyRevenue: paymentsRes.data.total_revenue || 0
      });

      setTodayAttendance(attendanceRes.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  return (
    <div>
      <h2>대시보드</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>전체 학생 수</h3>
          <div className="value">{stats.totalStudents}</div>
        </div>
        <div className="stat-card">
          <h3>전체 수업 수</h3>
          <div className="value">{stats.totalCourses}</div>
        </div>
        <div className="stat-card">
          <h3>오늘 출석</h3>
          <div className="value">{stats.todayAttendance}</div>
        </div>
        <div className="stat-card">
          <h3>이번 달 매출</h3>
          <div className="value">₩{stats.monthlyRevenue.toLocaleString()}</div>
        </div>
      </div>

      <div className="card">
        <h3>오늘 출석 현황</h3>
        {todayAttendance.length === 0 ? (
          <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
            오늘 출석한 학생이 없습니다.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>학생명</th>
                <th>수업명</th>
                <th>입실 시간</th>
                <th>퇴실 시간</th>
                <th>남은 수업</th>
              </tr>
            </thead>
            <tbody>
              {todayAttendance.map((record) => (
                <tr key={record.id}>
                  <td>{record.student_name}</td>
                  <td>{record.course_name}</td>
                  <td>{new Date(record.check_in_time).toLocaleTimeString('ko-KR')}</td>
                  <td>
                    {record.check_out_time
                      ? new Date(record.check_out_time).toLocaleTimeString('ko-KR')
                      : <span className="badge badge-info">수업 중</span>}
                  </td>
                  <td>{record.remaining_sessions}회</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
