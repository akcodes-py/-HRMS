import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'
import { leaveService } from '../../services/leaveService'
import { employeeService } from '../../services/employeeService'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'

const ApplyLeave = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const { isAdmin } = useAuth()

  const [employees, setEmployees] = useState([])
  const [form, setForm] = useState({
    employee: '',
    leave_type: 'casual',
    start_date: '',
    end_date: '',
    reason: '',
  })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isAdmin()) {
      employeeService.getAll({ page_size: 200 }).then(({ data }) => {
        setEmployees(data?.results ?? data ?? [])
      })
    }
  }, [])

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: '' }))
  }

  const validate = () => {
    const e = {}
    if (isAdmin() && !form.employee) e.employee = 'Select an employee.'
    if (!form.start_date) e.start_date = 'Start date is required.'
    if (!form.end_date) e.end_date = 'End date is required.'
    if (form.start_date && form.end_date && form.end_date < form.start_date)
      e.end_date = 'End date must be on or after start date.'
    if (!form.reason.trim()) e.reason = 'Reason is required.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      await leaveService.apply(form)
      toast.success('Leave request submitted!')
      navigate('/leaves')
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        setErrors(data)
      }
      toast.error('Failed to submit leave request.')
    } finally {
      setSaving(false)
    }
  }

  const duration =
    form.start_date && form.end_date && form.end_date >= form.start_date
      ? Math.floor((new Date(form.end_date) - new Date(form.start_date)) / 86400000) + 1
      : 0

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/leaves')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Apply for Leave</h2>
          <p className="text-sm text-slate-500">Submit a new leave request</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-100 p-6 space-y-4">
        {isAdmin() && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Employee <span className="text-red-500">*</span></label>
            <select
              value={form.employee}
              onChange={(e) => set('employee', e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.employee_id})</option>
              ))}
            </select>
            {errors.employee && <p className="mt-1 text-xs text-red-500">{errors.employee}</p>}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Leave Type</label>
          <select
            value={form.leave_type}
            onChange={(e) => set('leave_type', e.target.value)}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="casual">Casual Leave</option>
            <option value="sick">Sick Leave</option>
            <option value="annual">Annual Leave</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Start Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => set('start_date', e.target.value)}
              className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500
                ${errors.start_date ? 'border-red-400' : 'border-slate-200'}`}
            />
            {errors.start_date && <p className="mt-1 text-xs text-red-500">{errors.start_date}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">End Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={form.end_date}
              min={form.start_date}
              onChange={(e) => set('end_date', e.target.value)}
              className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500
                ${errors.end_date ? 'border-red-400' : 'border-slate-200'}`}
            />
            {errors.end_date && <p className="mt-1 text-xs text-red-500">{errors.end_date}</p>}
          </div>
        </div>

        {duration > 0 && (
          <div className="flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg">
            <span className="font-semibold">{duration}</span>
            <span>day{duration !== 1 ? 's' : ''} of leave requested</span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Reason <span className="text-red-500">*</span></label>
          <textarea
            value={form.reason}
            onChange={(e) => set('reason', e.target.value)}
            rows={3}
            placeholder="Please provide a brief reason for your leave..."
            className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none
              ${errors.reason ? 'border-red-400' : 'border-slate-200'}`}
          />
          {errors.reason && <p className="mt-1 text-xs text-red-500">{errors.reason}</p>}
        </div>

        <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
          <button type="button" onClick={() => navigate('/leaves')} className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg">Cancel</button>
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg">
            {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</> : <><Send size={14} /> Submit Request</>}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ApplyLeave
