import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Pencil, Mail, Phone, MapPin, Calendar, Briefcase, DollarSign } from 'lucide-react'
import { employeeService } from '../../services/employeeService'
import StatusBadge from '../../components/StatusBadge'
import Loader from '../../components/Loader'
import { useToast } from '../../hooks/useToast'

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-3 border-b border-slate-50">
    <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
      <Icon size={14} className="text-slate-500" />
    </div>
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-700 mt-0.5">{value || '—'}</p>
    </div>
  </div>
)

const EmployeeDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await employeeService.getById(id)
        setEmployee(data)
      } catch {
        toast.error('Employee not found.')
        navigate('/employees')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id])

  if (loading) return <Loader className="min-h-64" />
  if (!employee) return null

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/employees')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-bold text-slate-800">Employee Profile</h2>
        <div className="ml-auto">
          <Link
            to={`/employees/${id}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg"
          >
            <Pencil size={14} /> Edit
          </Link>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-indigo-600 to-indigo-400" />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-10 mb-4">
            <div className="w-20 h-20 rounded-xl bg-white border-4 border-white shadow-sm flex items-center justify-center overflow-hidden">
              {employee.profile_picture ? (
                <img src={employee.profile_picture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-indigo-600">
                  {employee.first_name?.[0]}{employee.last_name?.[0]}
                </span>
              )}
            </div>
            <div className="pb-1">
              <p className="text-lg font-bold text-slate-800">{employee.full_name}</p>
              <p className="text-sm text-slate-500">{employee.designation}</p>
            </div>
            <div className="ml-auto pb-1">
              <StatusBadge status={employee.employment_status} />
              <p className="text-xs text-slate-400 mt-1 font-mono">{employee.employee_id}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            <InfoRow icon={Mail} label="Email" value={employee.email} />
            <InfoRow icon={Phone} label="Phone" value={employee.phone} />
            <InfoRow icon={Briefcase} label="Department" value={employee.department_display} />
            <InfoRow icon={Briefcase} label="Designation" value={employee.designation} />
            <InfoRow icon={Calendar} label="Joining Date" value={employee.joining_date} />
            <InfoRow icon={DollarSign} label="Salary" value={employee.salary ? `₹${Number(employee.salary).toLocaleString()}` : null} />
            {employee.address && <InfoRow icon={MapPin} label="Address" value={employee.address} />}
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmployeeDetail
