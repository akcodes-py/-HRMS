import { Inbox } from 'lucide-react'

const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No records found',
  message = 'There is nothing to display here yet.',
  action,
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-4">
      <Icon size={24} className="text-slate-400" />
    </div>
    <h3 className="text-sm font-semibold text-slate-700 mb-1">{title}</h3>
    <p className="text-sm text-slate-400 max-w-xs">{message}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
)

export default EmptyState
