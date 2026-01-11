import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const login = (username, password) =>
  api.post('/auth/login', { username, password });

export const register = (userData) =>
  api.post('/auth/register', userData);

// Students
export const getStudents = () => api.get('/students');
export const getStudent = (id) => api.get(`/students/${id}`);
export const getStudentAttendanceStats = (id) => api.get(`/students/${id}/attendance-stats`);
export const createStudent = (data) => api.post('/students', data);
export const updateStudent = (id, data) => api.put(`/students/${id}`, data);
export const deleteStudent = (id) => api.delete(`/students/${id}`);

// Courses
export const getCourses = () => api.get('/courses');
export const getCourse = (id) => api.get(`/courses/${id}`);
export const createCourse = (data) => api.post('/courses', data);
export const updateCourse = (id, data) => api.put(`/courses/${id}`, data);
export const deleteCourse = (id) => api.delete(`/courses/${id}`);

// Schedules
export const getSchedules = () => api.get('/schedules');
export const getSchedule = (id) => api.get(`/schedules/${id}`);
export const getScheduleStudents = (id) => api.get(`/schedules/${id}/students`);
export const createSchedule = (data) => api.post('/schedules', data);
export const updateSchedule = (id, data) => api.put(`/schedules/${id}`, data);
export const deleteSchedule = (id) => api.delete(`/schedules/${id}`);

// Enrollments
export const getEnrollments = () => api.get('/enrollments');
export const getEnrollment = (id) => api.get(`/enrollments/${id}`);
export const createEnrollment = (data) => api.post('/enrollments', data);
export const updateEnrollment = (id, data) => api.put(`/enrollments/${id}`, data);
export const cancelEnrollment = (id) => api.delete(`/enrollments/${id}`);

// Attendance
export const getAttendance = (params) => api.get('/attendance', { params });
export const getTodayAttendance = () => api.get('/attendance/today');
export const checkIn = (data) => api.post('/attendance/check-in', data);
export const checkOut = (data) => api.post('/attendance/check-out', data);

// Payments
export const getPayments = (params) => api.get('/payments', { params });
export const getPayment = (id) => api.get(`/payments/${id}`);
export const getPaymentStats = (params) => api.get('/payments/stats/summary', { params });
export const createPayment = (data) => api.post('/payments', data);
export const updatePayment = (id, data) => api.put(`/payments/${id}`, data);

// Schedule Changes
export const getScheduleChangeRequests = (params) =>
  api.get('/schedule-changes', { params });
export const createScheduleChangeRequest = (data) =>
  api.post('/schedule-changes', data);
export const processScheduleChangeRequest = (id, data) =>
  api.put(`/schedule-changes/${id}`, data);
export const checkScheduleAvailability = (data) =>
  api.post('/schedule-changes/check-availability', data);

export default api;
