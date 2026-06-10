import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import DashboardLayout from '../layouts/DashboardLayout'
import AuthLayout from '../layouts/AuthLayout'
import ProtectedRoute from '../components/ProtectedRoute'

// Auth
import Login from '../pages/auth/Login'

// Dashboard
import AdminDashboard from '../pages/dashboard/AdminDashboard'
import EmployeeDashboard from '../pages/dashboard/EmployeeDashboard'

// Employees
import EmployeeList from '../pages/employees/EmployeeList'
import AddEmployee from '../pages/employees/AddEmployee'
import EditEmployee from '../pages/employees/EditEmployee'
import EmployeeDetail from '../pages/employees/EmployeeDetail'

// Attendance
import AttendancePage from '../pages/attendance/AttendancePage'

// Leaves
import LeaveList from '../pages/leaves/LeaveList'
import ApplyLeave from '../pages/leaves/ApplyLeave'

// Profile
import Profile from '../pages/profile/Profile'
import Loader from '../components/Loader'

const AppRoutes = () => {
  const { user, initializing } = useAuth()

  if (initializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader size="lg" />
      </div>
    )
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route element={<AuthLayout />}>
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <Login />}
        />
      </Route>

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={user?.role === 'admin' ? <AdminDashboard /> : <EmployeeDashboard />}
          />

          {/* Employees — admin only */}
          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="/employees" element={<EmployeeList />} />
            <Route path="/employees/add" element={<AddEmployee />} />
            <Route path="/employees/:id/edit" element={<EditEmployee />} />
            <Route path="/employees/:id" element={<EmployeeDetail />} />
          </Route>

          {/* Attendance */}
          <Route path="/attendance" element={<AttendancePage />} />

          {/* Leaves */}
          <Route path="/leaves" element={<LeaveList />} />
          <Route path="/leaves/apply" element={<ApplyLeave />} />

          {/* Profile */}
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default AppRoutes
