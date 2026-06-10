import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck, CalendarOff, User, Plus } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import DashboardCard from '../../components/DashboardCard'
import StatusBadge from '../../components/StatusBadge'
import { SkeletonCard } from '../../components/SkeletonLoader'
import { employeeService } from '../../services/employeeService'
import { attendanceService } from '../../services/attendanceService'
import { leaveService } from '../../services/leaveService'

const EmployeeDashboard = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [attSummary, setAttSummary] = useState(null)
  const [myLeaves, setMyLeaves] = useState([])
  const [loading, setLoading] = useState(true)

  const now = new Date()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, attRes, leavesRes] = await Promise.all([
          employeeService.myProfile().catch(() => ({ data: null })),
          attendanceService.monthlySummary({
            month: now.getMonth() + 1,
            year: now.getFullYear(),
          }).catch(() => ({ data: null })),
          leaveService.getAll({ page_size: 5 }).catch(() => ({ data: { results: [] } })),
        ])
        setProfile(profileRes.data)
        setAttSummary(attRes.data)
        setMyLeaves(leavesRes.data?.results || leavesRes.data || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const monthName = now.toLocaleString('default', { month: 'long' })

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl p-6 text-white">
        <p className="text-indigo-200 text-sm mb-1">Welcome back,</p>
        <h2 className="text-2xl font-bold">
          {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
        </h2>
        <p className="text-indigo-200 text-sm mt-1">
          {profile?.designation} · {profile?.department_display || profile?.department}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? (
          [...Array(3)].map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <DashboardCard
              title={`Present — ${monthName}`}
              value={attSummary?.present ?? 0}
              icon={CalendarCheck}
              color="green"
              subtitle={`WFH: ${attSummary?.wfh ?? 0}`}
            />
            <DashboardCard
              title={`Absent — ${monthName}`}
              value={attSummary?.absent ?? 0}
              icon={CalendarCheck}
              color="rose"
            />
            <DashboardCard
              title="My Leave Requests"
              value={myLeaves.length}
              icon={CalendarOff}
              color="amber"
              subtitle={`${myLeaves.filter((l) => l.status === 'pending').length} pending`}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Summary */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-700 text-sm">My Profile</h3>
            <Link to="/profile" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              Edit →
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => <div key={i} className="h-6 skeleton rounded" />)}
            </div>
          ) : profile ? (
            <div className="space-y-2 text-sm">
              {[
                { label: 'Employee ID', value: profile.employee_id },
                { label: 'Email', value: profile.email },
                { label: 'Department', value: profile.department_display },
                { label: 'Designation', value: profile.designation },
                { label: 'Joining Date', value: profile.joining_date },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-medium text-slate-700">{value || '—'}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No profile linked.</p>
          )}
        </div>

        {/* Recent Leaves */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-700 text-sm">My Recent Leaves</h3>
            <Link to="/leaves/apply" className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              <Plus size={12} /> Apply
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <div key={i} className="h-10 skeleton rounded" />)}
            </div>
          ) : myLeaves.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No leave requests yet.</p>
          ) : (
            <div className="space-y-2">
              {myLeaves.slice(0, 5).map((leave) => (
                <div key={leave.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{leave.leave_type_display}</p>
                    <p className="text-xs text-slate-400">
                      {leave.start_date} – {leave.end_date} · {leave.duration} day(s)
                    </p>
                  </div>
                  <StatusBadge status={leave.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EmployeeDashboard
