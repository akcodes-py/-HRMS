import { Bell, Search } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const Navbar = ({ title }) => {
  const { user } = useAuth()

  const initials = user?.first_name
    ? `${user.first_name[0]}${user.last_name?.[0] || ''}`
    : user?.username?.[0]?.toUpperCase() || '?'

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm">
      {/* Page Title */}
      <h1 className="text-lg font-semibold text-slate-800">
        {title || 'Dashboard'}
      </h1>

      {/* Right: Notification + Avatar */}
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
          <Bell size={18} />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
            {initials}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-700 leading-tight">
              {user?.first_name
                ? `${user.first_name} ${user.last_name}`
                : user?.username}
            </p>
            <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
