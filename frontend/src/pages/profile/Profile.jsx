import { useState, useEffect } from 'react'
import { Save, Camera } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { authService } from '../../services/authService'
import { employeeService } from '../../services/employeeService'
import StatusBadge from '../../components/StatusBadge'
import { useToast } from '../../hooks/useToast'

const Profile = () => {
  const { user, setUser } = useAuth()
  const toast = useToast()
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', department: '' })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      try {
        const empRes = await employeeService.myProfile().catch(() => ({ data: null }))
        setProfile(empRes.data)
        setForm({
          first_name: user?.first_name || '',
          last_name: user?.last_name || '',
          phone: user?.phone || '',
          department: user?.department || '',
        })
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [user])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await authService.updateProfile(form)
      setUser(data)
      localStorage.setItem('hrms_user', JSON.stringify(data))
      toast.success('Profile updated successfully!')
    } catch {
      toast.error('Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const initials = user?.first_name
    ? `${user.first_name[0]}${user.last_name?.[0] || ''}`
    : user?.username?.[0]?.toUpperCase() || '?'

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Header Card */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-indigo-600 to-indigo-400" />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-8 mb-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-xl bg-indigo-100 border-4 border-white shadow-sm flex items-center justify-center">
                {user?.profile_picture ? (
                  <img src={user.profile_picture} alt="Avatar" className="w-full h-full rounded-lg object-cover" />
                ) : (
                  <span className="text-xl font-bold text-indigo-600">{initials}</span>
                )}
              </div>
            </div>
            <div className="pb-1">
              <p className="text-base font-bold text-slate-800">
                {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
              </p>
              <p className="text-sm text-slate-500">{user?.email}</p>
            </div>
            <div className="ml-auto pb-1">
              <StatusBadge status={user?.role} />
            </div>
          </div>

          {profile && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-50">
              {[
                { label: 'Employee ID', value: profile.employee_id },
                { label: 'Department', value: profile.department_display },
                { label: 'Designation', value: profile.designation },
                { label: 'Joining Date', value: profile.joining_date },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className="text-sm font-medium text-slate-700">{value || '—'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-white rounded-xl border border-slate-100 p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Edit Profile</h3>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">First Name</label>
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Last Name</label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg"
            >
              {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</> : <><Save size={14} /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Profile
