import { useState, useEffect, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { employeeService } from '../../services/employeeService'
import { attendanceService } from '../../services/attendanceService'
import DataTable from '../../components/DataTable'
import StatusBadge from '../../components/StatusBadge'
import Modal from '../../components/Modal'
import { useToast } from '../../hooks/useToast'

const today = new Date().toISOString().split('T')[0]

const AttendancePage = () => {
  const { isAdmin, user } = useAuth()
  const toast = useToast()

  const [records, setRecords] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState(null)
  const [markOpen, setMarkOpen] = useState(false)
  const [form, setForm] = useState({ employee: '', date: today, status: 'present', check_in: '', check_out: '', remarks: '' })
  const [saving, setSaving] = useState(false)
  const [filterDate, setFilterDate] = useState('')

  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filterDate) params.date = filterDate

      const [recRes, sumRes] = await Promise.all([
        attendanceService.getAll(params),
        attendanceService.monthlySummary({ month, year }),
      ])
      setRecords(recRes.data?.results ?? recRes.data ?? [])
      setSummary(sumRes.data)
    } catch {
      toast.error('Failed to load attendance.')
    } finally {
      setLoading(false)
    }
  }, [filterDate, month, year])

  useEffect(() => { fetch() }, [fetch])

  useEffect(() => {
    if (isAdmin()) {
      employeeService.getAll({ page_size: 200 }).then(({ data }) => {
        setEmployees(data?.results ?? data ?? [])
      }).catch(() => {})
    }
  }, [])

  const handleMark = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await attendanceService.mark(form)
      toast.success('Attendance marked!')
      setMarkOpen(false)
      setForm({ employee: '', date: today, status: 'present', check_in: '', check_out: '', remarks: '' })
      fetch()
    } catch (err) {
      toast.error(err.response?.data?.non_field_errors?.[0] || 'Failed to mark attendance.')
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    isAdmin() && {
      key: 'employee_name',
      label: 'Employee',
      render: (row) => (
        <span className="font-medium text-slate-700">
          {row.employee_data?.full_name || `${row.employee_data?.first_name} ${row.employee_data?.last_name}`}
        </span>
      ),
    },
    { key: 'date', label: 'Date', sortable: true },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    { key: 'check_in', label: 'Check In', render: (r) => r.check_in || '—' },
    { key: 'check_out', label: 'Check Out', render: (r) => r.check_out || '—' },
    { key: 'remarks', label: 'Remarks', render: (r) => <span className="text-slate-500 text-xs">{r.remarks || '—'}</span> },
  ].filter(Boolean)

  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]

  return (
    <div className="space-y-6">
      {/* Monthly Summary */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Present', value: summary.present, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'WFH', value: summary.wfh, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Absent', value: summary.absent, color: 'text-red-500', bg: 'bg-red-50' },
            { label: 'Half Day', value: summary.half_day, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`${bg} rounded-xl p-4 text-center`}>
              <p className={`text-2xl font-bold ${color}`}>{value ?? 0}</p>
              <p className="text-xs text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-xl border border-slate-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex gap-3 flex-wrap">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              min="2020"
              max="2030"
              className="w-24 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Filter by date"
            />
          </div>
          <button
            onClick={() => setMarkOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg"
          >
            <Plus size={15} /> Mark Attendance
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <DataTable
          columns={columns}
          data={records}
          loading={loading}
          emptyMessage="No attendance records found."
        />
      </div>

      {/* Mark Modal */}
      <Modal open={markOpen} onClose={() => setMarkOpen(false)} title="Mark Attendance">
        <form onSubmit={handleMark} className="space-y-4">
          {isAdmin() && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Employee</label>
              <select
                required
                value={form.employee}
                onChange={(e) => setForm((f) => ({ ...f, employee: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="">Select Employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.employee_id})</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="wfh">Work From Home</option>
                <option value="half_day">Half Day</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Check In</label>
              <input
                type="time"
                value={form.check_in}
                onChange={(e) => setForm((f) => ({ ...f, check_in: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Check Out</label>
              <input
                type="time"
                value={form.check_out}
                onChange={(e) => setForm((f) => ({ ...f, check_out: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Remarks</label>
            <textarea
              value={form.remarks}
              onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setMarkOpen(false)} className="px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg">
              {saving ? 'Saving...' : 'Mark Attendance'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default AttendancePage
