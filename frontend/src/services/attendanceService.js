import api from './api'

export const attendanceService = {
  getAll: (params) => api.get('/attendance/', { params }),
  getById: (id) => api.get(`/attendance/${id}/`),
  mark: (data) => api.post('/attendance/', data),
  update: (id, data) => api.patch(`/attendance/${id}/`, data),
  delete: (id) => api.delete(`/attendance/${id}/`),
  monthlySummary: (params) => api.get('/attendance/monthly-summary/', { params }),
  todaySummary: () => api.get('/attendance/today/'),
}
