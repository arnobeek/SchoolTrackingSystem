import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const downloadBlob = async (url, filename, params = {}) => {
  const response = await api.get(url, {
    params,
    responseType: 'blob',
  });
  const href = window.URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(href);
};

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
};

export const teacherApi = {
  getAll: (params) => api.get('/teachers', { params }),
  getById: (id) => api.get(`/teachers/${id}`),
};

export const attendanceApi = {
  getToday: () => api.get('/attendance/today'),
  getSummary: () => api.get('/attendance/summary'),
  getTrends: () => api.get('/attendance/trends'),
  getTeacherHistory: (id) => api.get(`/attendance/teacher/${id}`),
  getStatus: (teacherId) => api.get(`/attendance/status/${teacherId}`),
  clockIn: (data) => api.post('/attendance/clockin', data),
  clockOut: (data) => api.post('/attendance/clockout', data),
};

export const resultApi = {
  getAll: (params) => api.get('/results', { params }),
  getSummary: () => api.get('/results/summary'),
};

export const feeApi = {
  getAll: () => api.get('/fees'),
  getSummary: () => api.get('/fees/summary'),
  recordPayment: (id, amount) => api.put(`/fees/${id}/pay`, { amount }),
};

export const notificationApi = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
};

export const reportApi = {
  getAttendance: (params) => api.get('/reports/attendance', { params }),
  getPerformance: (params) => api.get('/reports/performance', { params }),
  getFees: (params) => api.get('/reports/fees', { params }),
  exportAttendanceCsv: (params) => downloadBlob('/reports/attendance/export', 'attendance-report.csv', params),
  exportPerformanceCsv: (params) => downloadBlob('/reports/performance/export', 'performance-report.csv', params),
  exportFeesCsv: (params) => downloadBlob('/reports/fees/export', 'fees-report.csv', params),
};

export default api;
