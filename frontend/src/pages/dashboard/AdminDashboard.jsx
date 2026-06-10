import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, UserCheck, CalendarCheck, Clock,
  Plus, TrendingUp, FileText,
} from 'lucide-react'
import DashboardCard from '../../components/DashboardCard'
import StatusBadge from '../../components/StatusBadge'
import { SkeletonCard } from '../../components/SkeletonLoader'
import { employeeService } from '../../services/employeeService'
import { attendanceService } from '../../services/attendanceService'
import { leaveService } from '../../services/leaveService'

const AdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [todayAttendance, setTodayAttendance] = useState(null)
  const [pendingLeaves, setPendingLeaves] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, attRes, leavesRes] = await Promise.all([
          employeeService.getStats(),
          attendanceService.todaySummary(),
          leaveService.summary(),
        ])
        setStats(statsRes.data)
        setTodayAttendance(attRes.data)
        setPendingLeaves(leavesRes.data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <DashboardCard
              title="Total Employees"
              value={stats?.total ?? 0}
              icon={Users}
              color="indigo"
              subtitle="All employees"
            />
            <DashboardCard
              title="Active Employees"
              value={stats?.active ?? 0}
              icon={UserCheck}
              color="green"
              subtitle={`${stats?.inactive ?? 0} inactive`}
            />
            <DashboardCard
              title="Present Today"
              value={todayAttendance?.present ?? 0}
              icon={CalendarCheck}
              color="blue"
              subtitle={`of ${todayAttendance?.total_active_employees ?? 0} active`}
            />
            <DashboardCard
              title="Pending Leaves"
              value={pendingLeaves?.length ?? 0}
              icon={Clock}
              color="amber"
              subtitle="Awaiting review"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Attendance Summary */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-700 text-sm">Today's Attendance</h3>
            <Link
              to="/attendance"
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              View all →
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-8 skeleton rounded" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Present', value: todayAttendance?.present, color: 'bg-green-500', total: todayAttendance?.total_active_employees },
                { label: 'Work From Home', value: todayAttendance?.wfh, color: 'bg-blue-500', total: todayAttendance?.total_active_employees },
                { label: 'Absent', value: todayAttendance?.absent, color: 'bg-red-400', total: todayAttendance?.total_active_employees },
              ].map(({ label, value, color, total }) => {
                const pct = total > 0 ? Math.round((value / total) * 100) : 0
                return (
                  <div key={label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500">{label}</span>
                      <span className="font-semibold text-slate-700">{value ?? 0}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-full transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Pending Leave Requests */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-700 text-sm">Pending Leave Requests</h3>
            <Link
              to="/leaves"
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              View all →
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 skeleton rounded" />
              ))}
            </div>
          ) : pendingLeaves.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No pending requests.</p>
          ) : (
            <div className="space-y-2">
              {pendingLeaves.slice(0, 5).map((leave) => (
                <div
                  key={leave.id}
                  className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {leave.employee_data?.full_name || leave.employee_data?.first_name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {leave.leave_type_display} · {leave.duration} day(s)
                    </p>
                  </div>
                  <StatusBadge status="pending" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <h3 className="font-semibold text-slate-700 text-sm mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/employees/add"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700
              text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={15} /> Add Employee
          </Link>
          <Link
            to="/attendance"
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200
              text-slate-700 text-sm font-medium rounded-lg transition-colors"
          >
            <CalendarCheck size={15} /> Mark Attendance
          </Link>
          <Link
            to="/leaves"
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200
              text-slate-700 text-sm font-medium rounded-lg transition-colors"
          >
            <FileText size={15} /> Manage Leaves
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
