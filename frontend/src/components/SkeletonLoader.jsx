const SkeletonLoader = ({ height = 'h-4', width = 'w-full', rounded = 'rounded' }) => (
  <div className={`skeleton ${height} ${width} ${rounded}`} />
)

export const SkeletonCard = () => (
  <div className="bg-white rounded-xl border border-slate-100 p-5 space-y-3">
    <div className="flex items-start justify-between">
      <div className="space-y-2 flex-1">
        <SkeletonLoader height="h-3" width="w-24" />
        <SkeletonLoader height="h-7" width="w-16" />
        <SkeletonLoader height="h-3" width="w-32" />
      </div>
      <SkeletonLoader height="h-11" width="w-11" rounded="rounded-xl" />
    </div>
  </div>
)

export const SkeletonRow = ({ cols = 5 }) => (
  <tr className="border-b border-slate-100">
    {[...Array(cols)].map((_, i) => (
      <td key={i} className="px-4 py-3">
        <SkeletonLoader height="h-4" width={i === 0 ? 'w-24' : 'w-full'} />
      </td>
    ))}
  </tr>
)

export default SkeletonLoader
