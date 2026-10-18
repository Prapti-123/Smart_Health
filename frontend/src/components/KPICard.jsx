export default function KPICard({
  icon: Icon,
  label,
  value,
  unit,
  chipText,
  chipColor = "slate",
  iconBg = "bg-teal-50 text-teal-700",
}) {
  const CHIP_STYLES = {
    red: "bg-red-50 text-red-700 border-red-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    teal: "bg-teal-50 text-teal-700 border-teal-200",
    slate: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {label}
        </span>
        {Icon && (
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2 mt-1">
        <div className="text-3xl font-bold tracking-tight text-slate-900">
          {value}
          {unit && <span className="text-base font-normal text-slate-500 ml-1">{unit}</span>}
        </div>
        {chipText && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
              CHIP_STYLES[chipColor] || CHIP_STYLES.slate
            }`}
          >
            {chipText}
          </span>
        )}
      </div>
    </div>
  );
}
