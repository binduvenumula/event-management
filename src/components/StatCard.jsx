export default function StatCard({ label, value, icon: Icon, tone = 'bg-sky text-royal', hint }) {
  return (
    <div className="card flex items-center gap-4 p-4">
      {Icon && <div className={`rounded-xl p-3 ${tone}`}><Icon className="h-6 w-6" /></div>}
      <div className="min-w-0">
        <p className="text-2xl font-bold text-ink">{value ?? '-'}</p>
        <p className="truncate text-sm text-muted">{label}</p>
        {hint && <p className="text-xs text-slate-400">{hint}</p>}
      </div>
    </div>
  );
}
