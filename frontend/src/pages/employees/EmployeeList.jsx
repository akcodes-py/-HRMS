import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Eye, Filter } from 'lucide-react'
import DataTable from '../../components/DataTable'
import SearchBar from '../../components/SearchBar'
import StatusBadge from '../../components/StatusBadge'
import ConfirmDialog from '../../components/ConfirmDialog'
import { employeeService } from '../../services/employeeService'
import { useToast } from '../../hooks/useToast'
import { usePagination } from '../../hooks/usePagination'

const DEPARTMENTS = [
  'engineering', 'human_resources', 'finance', 'marketing',
  'sales', 'operations', 'design', 'legal', 'other',
]

const EmployeeList = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const pagination = usePagination()

  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterDept, setFilterDept] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchEmployees = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page: pagination.page, page_size: pagination.pageSize }
      if (search) params.search = search
      if (filterDept) params.department = filterDept
      if (filterStatus) params.status = filterStatus

      const { data } = await employeeService.getAll(params)
      const results = data?.results ?? data ?? []
      setEmployees(results)
      pagination.setTotalCount(data?.count ?? results.length)
    } catch {
      toast.error('Failed to load employees.')
    } finally {
      setLoading(false)
    }
  }, [pagination.page, search, filterDept, filterStatus])

  useEffect(() => { fetchEmployees() }, [fetchEmployees])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await employeeService.delete(deleteTarget.id)
      toast.success('Employee deleted.')
      setDeleteTarget(null)
      fetchEmployees()
    } catch {
      toast.error('Failed to delete employee.')
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    {
      key: 'employee_id',
      label: 'ID',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs text-indigo-600 font-semibold">{row.employee_id}</span>
      ),
    },
    {
      key: 'full_name',
      label: 'Name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
            {row.first_name?.[0]}{row.last_name?.[0]}
          </div>
          <div>
            <p className="font-medium text-slate-800 text-sm">{row.full_name}</p>
            <p className="text-xs text-slate-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'department_display', label: 'Department', sortable: true },
    { key: 'designation', label: 'Designation', sortable: true },
    {
      key: 'employment_status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.employment_status} />,
    },
    { key: 'joining_date', label: 'Joined', sortable: true },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/employees/${row.id}`) }}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
            title="View"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/employees/${row.id}/edit`) }}
            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
            title="Edit"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(row) }}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Employees</h2>
          <p className="text-sm text-slate-500">
            {pagination.totalCount} total employee{pagination.totalCount !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => navigate('/employees/add')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700
            text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={15} /> Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <SearchBar
            value={search}
            onChange={(v) => { setSearch(v); pagination.reset() }}
            placeholder="Search by name, email, ID..."
          />
          <select
            value={filterDept}
            onChange={(e) => { setFilterDept(e.target.value); pagination.reset() }}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none
              focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700 min-w-36"
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); pagination.reset() }}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none
              focus:ring-2 focus:ring-indigo-500 bg-white text-slate-700 min-w-32"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <DataTable
          columns={columns}
          data={employees}
          loading={loading}
          emptyMessage="No employees found."
          onRowClick={(row) => navigate(`/employees/${row.id}`)}
        />

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={pagination.prevPage}
                disabled={!pagination.hasPrev}
                className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg
                  disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={pagination.nextPage}
                disabled={!pagination.hasNext}
                className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg
                  disabled:opacity-40 hover:bg-slate-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Employee"
        message={`Are you sure you want to delete ${deleteTarget?.full_name}? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  )
}

export default EmployeeList
