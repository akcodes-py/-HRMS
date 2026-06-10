import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('hrms_user')
    return stored ? JSON.parse(stored) : null
  })
  const [tokens, setTokens] = useState(() => {
    const stored = localStorage.getItem('hrms_tokens')
    return stored ? JSON.parse(stored) : null
  })
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)

  // On mount, validate stored token by fetching current user
  useEffect(() => {
    const init = async () => {
      if (tokens?.access) {
        try {
          const { data } = await authService.me()
          setUser(data)
          localStorage.setItem('hrms_user', JSON.stringify(data))
        } catch {
          // Token invalid — clear storage
          clearAuth()
        }
      }
      setInitializing(false)
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const clearAuth = () => {
    setUser(null)
    setTokens(null)
    localStorage.removeItem('hrms_tokens')
    localStorage.removeItem('hrms_user')
  }

  const login = useCallback(async (username, password) => {
    setLoading(true)
    try {
      const { data } = await authService.login({ username, password })
      const newTokens = { access: data.access, refresh: data.refresh }
      setTokens(newTokens)
      localStorage.setItem('hrms_tokens', JSON.stringify(newTokens))

      // Fetch user profile
      const meResponse = await authService.me()
      setUser(meResponse.data)
      localStorage.setItem('hrms_user', JSON.stringify(meResponse.data))
      return { success: true }
    } catch (error) {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.non_field_errors?.[0] ||
        'Invalid username or password.'
      return { success: false, message }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      if (tokens?.refresh) {
        await authService.logout(tokens.refresh)
      }
    } catch {
      // Ignore errors on logout
    } finally {
      clearAuth()
    }
  }, [tokens])

  const isAdmin = () => user?.role === 'admin'
  const isEmployee = () => user?.role === 'employee'

  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        loading,
        initializing,
        login,
        logout,
        isAdmin,
        isEmployee,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuthContext = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuthContext must be used inside <AuthProvider>')
  return ctx
}

export default AuthContext
