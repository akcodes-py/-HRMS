const DashboardCard = ({ title, value, icon: Icon, color = 'indigo', subtitle, trend }) => {
  const colorMap = {
    indigo: {
      bg: 'bg-indigo-50',
      icon: 'bg-indigo-100 text-indigo-600',
      text: 'text-indigo-600',
      border: 'border-indigo-100',
    },
    green: {
      bg: 'bg-green-50',
      icon: 'bg-green-100 text-green-600',
      text: 'text-green-600',
      border: 'border-green-100',
    },
    amber: {
      bg: 'bg-amber-50',
      icon: 'bg-amber-100 text-amber-600',
      text: 'text-amber-600',
      border: 'border-amber-100',
    },
    rose: {
      bg: 'bg-rose-50',
      icon: 'bg-rose-100 text-rose-600',
      text: 'text-rose-600',
      border: 'border-rose-100',
    },
    blue: {
      bg: 'bg-blue-50',
      icon: 'bg-blue-100 text-blue-600',
      text: 'text-blue-600',
      border: 'border-blue-100',
    },
    slate: {
      bg: 'bg-slate-50',
      icon: 'bg-slate-100 text-slate-600',
      text: 'text-slate-600',
      border: 'border-slate-100',
    },
  }

  const c = colorMap[color] || colorMap.indigo

  return (
    <div
      className={`bg-white rounded-xl border ${c.border} p-5 card-hover
        flex items-start justify-between gap-4`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-500 font-medium mb-1 truncate">{title}</p>
        <p className="text-3xl font-bold text-slate-800 leading-none mb-1">
          {value ?? '—'}
        </p>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
        )}
        {trend !== undefined && (
          <p className={`text-xs mt-1 font-medium ${trend >= 0 ? 'text-green-500' : 'text-rose-500'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last month
          </p>
        )}
      </div>
      {Icon && (
        <div className={`w-11 h-11 rounded-xl ${c.icon} flex items-center justify-center flex-shrink-0`}>
          <Icon size={22} />
        </div>
      )}
    </div>
  )
}

export default DashboardCard
