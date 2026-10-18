export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm animate-pulse space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
        <div className="h-8 w-8 bg-slate-200 rounded-lg"></div>
      </div>
      <div className="h-8 bg-slate-200 rounded w-1/2"></div>
      <div className="h-3 bg-slate-100 rounded w-2/3"></div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 animate-pulse space-y-3">
      <div className="h-5 bg-slate-200 rounded w-1/4 mb-4"></div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center py-2 border-b border-slate-100">
          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="h-4 bg-slate-100 rounded w-1/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/6 ml-auto"></div>
        </div>
      ))}
    </div>
  );
}

export function MapSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 animate-pulse">
      <div className="h-5 bg-slate-200 rounded w-1/4 mb-3"></div>
      <div className="h-[420px] bg-slate-200 rounded-lg flex items-center justify-center text-slate-400">
        Loading Map...
      </div>
    </div>
  );
}
