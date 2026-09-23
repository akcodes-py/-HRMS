import { Outlet } from 'react-router-dom'
import { Building2 } from 'lucide-react'

const AuthLayout = () => (
  <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-11 h-11 bg-slate-900 rounded flex items-center justify-center mb-3">
          <Building2 size={22} className="text-white" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">HRMS</h1>
        <p className="text-slate-500 text-sm mt-1">Human Resource Management System</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded border border-slate-200 p-8">
        <Outlet />
      </div>
    </div>
  </div>
)

export default AuthLayout
