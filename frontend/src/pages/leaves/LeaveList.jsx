import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Plus, CheckCircle, XCircle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { leaveService } from '../../services/leaveService'
import DataTable from '../../components/DataTable'
import StatusBadge from '../../components/StatusBadge'
import ConfirmDialog from '../../components/ConfirmDialog'
import { useToast } from '../../hooks/useToast'

const LeaveList = () => {
  const { isAdmin } = useAuth()
  const toast = useToast()
  const [leaves, setLeaves] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [actionTarget, setActionTarget] = useState(null) // { leave, type: 'approve'|'reject' }
  const [processing, setProcessing] = useState(false)

  const fetchLeaves = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filterStatus) params.status = filterStatus
      const { data } = await leaveService.getAll(params)
      setLeaves(data?.results ?? data ?? [])
    } catch {
      toast.error('Failed to load leaves.')
    } finally {
      setLoading(false)
    }
  }, [filterStatus])

  useEffect(() => { fetchLeaves() }, [fetchLeaves])

  const handleAction = async () => {
    if (!actionTarget) return
    setProcessing(true)
    try {
      if (actionTarget.type === 'approve') {
        await leaveService.approve(actionTarget.leave.id)
        toast.success('Leave approved.')
      } else {
        await leaveService.reject(actionTarget.leave.id, '')
        toast.success('Leave rejected.')
      }
      setActionTarget(null)
      fetchLeaves()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Action failed.')
    } finally {
      setProcessing(false)
    }
  }

  const columns = [
    isAdmin() && {
      key: 'employee',
      label: 'Employee',
      render: (row) => (
        <span className="font-medium text-slate-700">
          {row.employee_data?.full_name || row.employee_data?.first_name}
        </span>
      ),
    },
    { key: 'leave_type_display', label: 'Type', render: (row) => <StatusBadge status={row.leave_type} customLabel={row.leave_type_display} /> },
    { key: 'start_date', label: 'From', sortable: true },
    { key: 'end_date', label: 'To', sortable: true },
    { key: 'duration', label: 'Days', render: (row) => `${row.duration}d` },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'applied_on',
      label: 'Applied',
      sortable: true,
      render: (row) => new Date(row.applied_on).toLocaleDateString(),
    },
    isAdmin() && {
      key: 'actions',
      label: 'Actions',
      render: (row) => row.status === 'pending' ? (
        <div className="flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setActionTarget({ leave: row, type: 'approve' }) }}
            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
            title="Approve"
          >
            <CheckCircle size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setActionTarget({ leave: row, type: 'reject' }) }}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
            title="Reject"
          >
            <XCircle size={16} />
          </button>
        </div>
      ) : <span className="text-slate-300 text-xs">—</span>,
    },
  ].filter(Boolean)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-800">Leave Requests</h2>
        <Link
          to="/leaves/apply"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg"
        >
          <Plus size={15} /> Apply Leave
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 p-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <DataTable
          columns={columns}
          data={leaves}
          loading={loading}
          emptyMessage="No leave requests found."
        />
      </div>

      <ConfirmDialog
        open={!!actionTarget}
        onClose={() => setActionTarget(null)}
        onConfirm={handleAction}
        title={actionTarget?.type === 'approve' ? 'Approve Leave' : 'Reject Leave'}
        message={`Are you sure you want to ${actionTarget?.type} this leave request?`}
        confirmLabel={actionTarget?.type === 'approve' ? 'Approve' : 'Reject'}
        variant={actionTarget?.type === 'reject' ? 'danger' : 'primary'}
        loading={processing}
      />
    </div>
  )
}

export default LeaveList
