import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { employeeService } from '../../services/employeeService'
import { useToast } from '../../hooks/useToast'

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

const FieldGroup = ({ label, required, error, children }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
)

const Input = ({ error, ...props }) => (
  <input
    {...props}
    className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2
      focus:ring-indigo-500 focus:border-transparent transition
      ${error ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'}`}
  />
)

const Select = ({ error, children, ...props }) => (
  <select
    {...props}
    className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2
      focus:ring-indigo-500 focus:border-transparent transition bg-white
      ${error ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
  >
    {children}
  </select>
)

const initialForm = {
  first_name: '', last_name: '', email: '', phone: '',
  department: '', designation: '', joining_date: '',
  salary: '', employment_status: 'active', address: '',
  profile_picture: null,
}

const AddEmployee = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.first_name.trim()) e.first_name = 'First name is required.'
    if (!form.last_name.trim()) e.last_name = 'Last name is required.'
    if (!form.email.trim()) e.email = 'Email is required.'
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Invalid email address.'
    if (!form.department) e.department = 'Department is required.'
    if (!form.designation.trim()) e.designation = 'Designation is required.'
    if (!form.joining_date) e.joining_date = 'Joining date is required.'
    if (!form.salary) e.salary = 'Salary is required.'
    else if (isNaN(Number(form.salary))) e.salary = 'Must be a valid number.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (v !== null && v !== '') fd.append(k, v)
      })
      await employeeService.create(fd)
      toast.success('Employee added successfully!')
      navigate('/employees')
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        setErrors(data)
        toast.error('Please fix the errors below.')
      } else {
        toast.error('Failed to add employee.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/employees')}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Add New Employee</h2>
          <p className="text-sm text-slate-500">Fill in the details to create an employee record</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-100 p-6">
        {/* Personal Info */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">
            Personal Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldGroup label="First Name" required error={errors.first_name}>
              <Input value={form.first_name} onChange={(e) => set('first_name', e.target.value)} error={errors.first_name} placeholder="John" />
            </FieldGroup>
            <FieldGroup label="Last Name" required error={errors.last_name}>
              <Input value={form.last_name} onChange={(e) => set('last_name', e.target.value)} error={errors.last_name} placeholder="Doe" />
            </FieldGroup>
            <FieldGroup label="Email" required error={errors.email}>
              <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email} placeholder="john@company.com" />
            </FieldGroup>
            <FieldGroup label="Phone" error={errors.phone}>
              <Input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 9876543210" />
            </FieldGroup>
          </div>
        </div>

        {/* Employment Info */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">
            Employment Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldGroup label="Department" required error={errors.department}>
              <Select value={form.department} onChange={(e) => set('department', e.target.value)} error={errors.department}>
                <option value="">Select Department</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </Select>
            </FieldGroup>
            <FieldGroup label="Designation" required error={errors.designation}>
              <Input value={form.designation} onChange={(e) => set('designation', e.target.value)} error={errors.designation} placeholder="Software Engineer" />
            </FieldGroup>
            <FieldGroup label="Joining Date" required error={errors.joining_date}>
              <Input type="date" value={form.joining_date} onChange={(e) => set('joining_date', e.target.value)} error={errors.joining_date} />
            </FieldGroup>
            <FieldGroup label="Salary (₹)" required error={errors.salary}>
              <Input type="number" value={form.salary} onChange={(e) => set('salary', e.target.value)} error={errors.salary} placeholder="50000" min="0" />
            </FieldGroup>
            <FieldGroup label="Employment Status" error={errors.employment_status}>
              <Select value={form.employment_status} onChange={(e) => set('employment_status', e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="terminated">Terminated</option>
                <option value="on_leave">On Leave</option>
              </Select>
            </FieldGroup>
          </div>
        </div>

        {/* Address */}
        <div className="mb-6">
          <FieldGroup label="Address">
            <textarea
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              rows={2}
              placeholder="Optional address"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </FieldGroup>
        </div>

        {/* Profile Picture */}
        <div className="mb-6">
          <FieldGroup label="Profile Picture">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => set('profile_picture', e.target.files[0] || null)}
              className="text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3
                file:rounded-lg file:border-0 file:text-sm file:font-medium
                file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100"
            />
          </FieldGroup>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigate('/employees')}
            className="px-4 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600
              hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors"
          >
            {saving ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
            ) : (
              <><Save size={15} /> Add Employee</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddEmployee
