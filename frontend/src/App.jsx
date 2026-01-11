import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Students from './components/Students';
import Courses from './components/Courses';
import Schedules from './components/Schedules';
import Attendance from './components/Attendance';
import Payments from './components/Payments';
import ScheduleChangeRequests from './components/ScheduleChangeRequests';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div>
        <Navbar user={user} onLogout={handleLogout} />
        <div className="container">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/schedules" element={<Schedules />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/schedule-changes" element={<ScheduleChangeRequests />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  return (
    <div className="navbar">
      <h1>학원 관리 시스템</h1>
      <nav>
        <Link to="/">대시보드</Link>
        <Link to="/students">학생 관리</Link>
        <Link to="/courses">수업 관리</Link>
        <Link to="/schedules">스케줄 관리</Link>
        <Link to="/attendance">출결 관리</Link>
        <Link to="/payments">결제 관리</Link>
        <Link to="/schedule-changes">시간 변경 요청</Link>
        <button onClick={handleLogout} className="btn btn-secondary">
          로그아웃 ({user.name})
        </button>
      </nav>
    </div>
  );
}

export default App;
