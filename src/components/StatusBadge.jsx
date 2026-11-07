// Coloured pill for event / registration statuses.
const TONES = {
  approved: 'bg-emerald-100 text-emerald-700',
  registered: 'bg-emerald-100 text-emerald-700',
  active: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-800',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-slate-200 text-slate-600',
  withdrawn: 'bg-slate-200 text-slate-600',
  inactive: 'bg-slate-200 text-slate-600',
  draft: 'bg-slate-200 text-slate-700',
};

export default function StatusBadge({ status, className = '' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${TONES[status] || 'bg-slate-100 text-slate-700'} ${className}`}>
      {status}
    </span>
  );
}
