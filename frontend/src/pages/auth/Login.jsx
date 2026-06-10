import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'

const Login = () => {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [form, setForm] = useState({ username: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.username.trim()) e.username = 'Username is required.'
    if (!form.password) e.password = 'Password is required.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    const result = await login(form.username.trim(), form.password)
    if (result.success) {
      toast.success('Welcome back!')
      navigate('/dashboard')
    } else {
      toast.error(result.message)
      setErrors({ general: result.message })
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">Sign in</h2>
        <p className="text-sm text-slate-500 mt-1">Enter your credentials to access your account</p>
      </div>

      {errors.general && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{errors.general}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Username
          </label>
          <input
            type="text"
            value={form.username}
            onChange={(e) => {
              setForm((f) => ({ ...f, username: e.target.value }))
              setErrors((er) => ({ ...er, username: '' }))
            }}
            placeholder="Enter your username"
            autoComplete="username"
            className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2
              focus:ring-indigo-500 focus:border-transparent transition
              ${errors.username ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'}`}
          />
          {errors.username && (
            <p className="mt-1 text-xs text-red-500">{errors.username}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => {
                setForm((f) => ({ ...f, password: e.target.value }))
                setErrors((er) => ({ ...er, password: '' }))
              }}
              placeholder="Enter your password"
              autoComplete="current-password"
              className={`w-full px-3 py-2.5 pr-10 text-sm border rounded-lg focus:outline-none
                focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition
                ${errors.password ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-red-500">{errors.password}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600
            hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold
            rounded-lg transition-colors mt-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <LogIn size={16} />
              Sign In
            </>
          )}
        </button>
      </form>

      <p className="text-xs text-center text-slate-400 mt-6">
        Contact your administrator if you don't have an account.
      </p>
    </div>
  )
}

export default Login
