import { Outlet } from 'react-router-dom'
import { Building2 } from 'lucide-react'

const AuthLayout = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900
    flex items-center justify-center p-4">
    {/* Background decoration */}
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
    </div>

    <div className="w-full max-w-md relative">
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-indigo-500/30">
          <Building2 size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">HRMS</h1>
        <p className="text-slate-400 text-sm mt-1">Human Resource Management System</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-2xl p-8">
        <Outlet />
      </div>
    </div>
  </div>
)

export default AuthLayout
