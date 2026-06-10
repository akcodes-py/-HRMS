const STATUS_MAP = {
  // Employment status
  active: { label: 'Active', classes: 'bg-green-100 text-green-700' },
  inactive: { label: 'Inactive', classes: 'bg-slate-100 text-slate-600' },
  terminated: { label: 'Terminated', classes: 'bg-red-100 text-red-700' },
  on_leave: { label: 'On Leave', classes: 'bg-amber-100 text-amber-700' },

  // Attendance
  present: { label: 'Present', classes: 'bg-green-100 text-green-700' },
  absent: { label: 'Absent', classes: 'bg-red-100 text-red-700' },
  wfh: { label: 'WFH', classes: 'bg-blue-100 text-blue-700' },
  half_day: { label: 'Half Day', classes: 'bg-amber-100 text-amber-700' },

  // Leave status
  pending: { label: 'Pending', classes: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approved', classes: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', classes: 'bg-red-100 text-red-700' },

  // Roles
  admin: { label: 'Admin', classes: 'bg-indigo-100 text-indigo-700' },
  employee: { label: 'Employee', classes: 'bg-slate-100 text-slate-600' },

  // Leave types
  sick: { label: 'Sick', classes: 'bg-rose-100 text-rose-700' },
  casual: { label: 'Casual', classes: 'bg-cyan-100 text-cyan-700' },
  annual: { label: 'Annual', classes: 'bg-violet-100 text-violet-700' },
  other: { label: 'Other', classes: 'bg-slate-100 text-slate-600' },
}

const StatusBadge = ({ status, customLabel }) => {
  const config = STATUS_MAP[status?.toLowerCase()] || {
    label: customLabel || status || 'Unknown',
    classes: 'bg-slate-100 text-slate-600',
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        ${config.classes}`}
    >
      {customLabel || config.label}
    </span>
  )
}

export default StatusBadge
