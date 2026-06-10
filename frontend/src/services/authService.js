import api from './api'

export const authService = {
  login: (credentials) => api.post('/token/', credentials),
  refresh: (refresh) => api.post('/token/refresh/', { refresh }),
  verify: (token) => api.post('/token/verify/', { token }),
  logout: (refresh) => api.post('/accounts/logout/', { refresh }),
  me: () => api.get('/accounts/me/'),
  updateProfile: (data) => api.patch('/accounts/me/', data),
  changePassword: (data) => api.post('/accounts/change-password/', data),
  register: (data) => api.post('/accounts/register/', data),
  getUsers: () => api.get('/accounts/users/'),
}
