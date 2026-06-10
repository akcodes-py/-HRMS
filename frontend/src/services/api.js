import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// ---------- Request Interceptor — attach JWT ----------
api.interceptors.request.use(
  (config) => {
    const tokens = JSON.parse(localStorage.getItem('hrms_tokens') || 'null')
    if (tokens?.access) {
      config.headers.Authorization = `Bearer ${tokens.access}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ---------- Response Interceptor — auto-refresh on 401 ----------
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const tokens = JSON.parse(localStorage.getItem('hrms_tokens') || 'null')
      if (!tokens?.refresh) {
        isRefreshing = false
        // Force logout
        localStorage.removeItem('hrms_tokens')
        localStorage.removeItem('hrms_user')
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post('/api/token/refresh/', {
          refresh: tokens.refresh,
        })
        const newTokens = { ...tokens, access: data.access }
        localStorage.setItem('hrms_tokens', JSON.stringify(newTokens))
        api.defaults.headers.common.Authorization = `Bearer ${data.access}`
        processQueue(null, data.access)
        originalRequest.headers.Authorization = `Bearer ${data.access}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        localStorage.removeItem('hrms_tokens')
        localStorage.removeItem('hrms_user')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export default api
