import { useEffect, useState } from 'react';
import { RotateCcw, Search } from 'lucide-react';
import { EVENT_CATEGORIES } from '../utils/constants';

// Sticky search + filter bar. `filters` = { q, club, category, from, to, open }.
export default function SearchFilterBar({ filters, onChange, clubs = [], onReset }) {
  const [q, setQ] = useState(filters.q || '');

  // debounce the search box so we don't hit the API on every keystroke
  useEffect(() => {
    const t = setTimeout(() => q !== (filters.q || '') && onChange({ q }), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);
  useEffect(() => { setQ(filters.q || ''); }, [filters.q]);

  return (
    <div className="sticky top-16 z-30 border-b border-slate-200 bg-white/95 shadow-sm">
      <div className="mx-auto max-w-7xl space-y-3 px-4 py-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9" type="search" placeholder="Search events by title, keyword or venue..."
            value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search events"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <select className="input" value={filters.club || ''} onChange={(e) => onChange({ club: e.target.value })} aria-label="Club">
            <option value="">All clubs</option>
            {clubs.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select className="input" value={filters.category || ''} onChange={(e) => onChange({ category: e.target.value })} aria-label="Category">
            <option value="">All categories</option>
            {EVENT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input className="input" type="date" value={filters.from || ''} max={filters.to || undefined} onChange={(e) => onChange({ from: e.target.value })} aria-label="From date" title="From date" />
          <input className="input" type="date" value={filters.to || ''} min={filters.from || undefined} onChange={(e) => onChange({ to: e.target.value })} aria-label="To date" title="To date" />
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-royal" checked={filters.open === 'true'} onChange={(e) => onChange({ open: e.target.checked ? 'true' : '' })} />
            Registration open
          </label>
          <button className="btn-outline" onClick={onReset}><RotateCcw className="h-4 w-4" /> Reset</button>
        </div>
      </div>
    </div>
  );
}
