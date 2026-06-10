import api from './api'

export const leaveService = {
  getAll: (params) => api.get('/leaves/', { params }),
  getById: (id) => api.get(`/leaves/${id}/`),
  apply: (data) => api.post('/leaves/', data),
  update: (id, data) => api.patch(`/leaves/${id}/`, data),
  delete: (id) => api.delete(`/leaves/${id}/`),
  approve: (id) => api.post(`/leaves/${id}/approve/`),
  reject: (id, reason) => api.post(`/leaves/${id}/reject/`, { rejection_reason: reason }),
  pendingCount: () => api.get('/leaves/pending-count/'),
  summary: () => api.get('/leaves/summary/'),
}
