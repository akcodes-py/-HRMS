import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { employeeService } from '../../services/employeeService'
import { useToast } from '../../hooks/useToast'
import Loader from '../../components/Loader'

const DEPARTMENTS = [
  { value: 'engineering', label: 'Engineering' },
  { value: 'human_resources', label: 'Human Resources' },
  { value: 'finance', label: 'Finance' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'sales', label: 'Sales' },
  { value: 'operations', label: 'Operations' },
  { value: 'design', label: 'Design' },
  { value: 'legal', label: 'Legal' },
  { value: 'other', label: 'Other' },
]

const Input = ({ error, ...props }) => (
  <input
    {...props}
    className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2
      focus:ring-indigo-500 focus:border-transparent transition
      ${error ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'}`}
  />
)

const EditEmployee = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const [form, setForm] = useState(null)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await employeeService.getById(id)
        setForm({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || '',
          phone: data.phone || '',
          department: data.department || '',
          designation: data.designation || '',
          joining_date: data.joining_date || '',
          salary: data.salary || '',
          employment_status: data.employment_status || 'active',
          address: data.address || '',
        })
      } catch {
        toast.error('Failed to load employee.')
        navigate('/employees')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id])

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v) })
      await employeeService.update(id, fd)
      toast.success('Employee updated successfully!')
      navigate(`/employees/${id}`)
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        setErrors(data)
        toast.error('Please fix the errors below.')
      } else {
        toast.error('Failed to update employee.')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loader className="min-h-64" />

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Edit Employee</h2>
          <p className="text-sm text-slate-500">Update employee information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-100 p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { field: 'first_name', label: 'First Name', type: 'text', placeholder: 'John' },
            { field: 'last_name', label: 'Last Name', type: 'text', placeholder: 'Doe' },
            { field: 'email', label: 'Email', type: 'email', placeholder: 'john@company.com' },
            { field: 'phone', label: 'Phone', type: 'tel', placeholder: '+91 9876543210' },
            { field: 'designation', label: 'Designation', type: 'text', placeholder: 'Software Engineer' },
            { field: 'joining_date', label: 'Joining Date', type: 'date' },
            { field: 'salary', label: 'Salary (₹)', type: 'number', placeholder: '50000' },
          ].map(({ field, label, type, placeholder }) => (
            <div key={field}>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
              <Input
                type={type}
                value={form[field]}
                onChange={(e) => set(field, e.target.value)}
                placeholder={placeholder}
                error={errors[field]}
              />
              {errors[field] && <p className="mt-1 text-xs text-red-500">{errors[field]}</p>}
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Department</label>
            <select
              value={form.department}
              onChange={(e) => set('department', e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Select Department</option>
              {DEPARTMENTS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
            <select
              value={form.employment_status}
              onChange={(e) => set('employment_status', e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="terminated">Terminated</option>
              <option value="on_leave">On Leave</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Address</label>
          <textarea
            value={form.address}
            onChange={(e) => set('address', e.target.value)}
            rows={2}
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg">Cancel</button>
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg">
            {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</> : <><Save size={15} /> Save Changes</>}
          </button>
        </div>
      </form>
    </div>
  )
}

export default EditEmployee
