import { useEffect, useMemo, useState } from 'react';
import { Search, Users } from 'lucide-react';
import api, { unwrap } from '../../api/axios';
import ClubCard from '../../components/ClubCard';
import EmptyState from '../../components/EmptyState';
import { CardSkeletons } from '../../components/Spinner';
import { CLUB_CATEGORIES } from '../../utils/constants';

export default function Clubs() {
  const [clubs, setClubs] = useState(null);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => { api.get('/clubs').then((r) => setClubs(unwrap(r))).catch(() => setClubs([])); }, []);

  const shown = useMemo(
    () => (clubs || []).filter((c) =>
      (!category || c.category === category) &&
      (!q || `${c.name} ${c.description}`.toLowerCase().includes(q.toLowerCase()))),
    [clubs, q, category]
  );

  return (
    <>
      <div className="bg-gradient-to-r from-navy to-royal py-8 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <h1 className="text-3xl font-extrabold">Student clubs</h1>
          <p className="mt-1 text-blue-100">Explore communities and follow their events.</p>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder="Search clubs..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search clubs" />
          </div>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
            <option value="">All categories</option>
            {CLUB_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        {clubs === null ? <CardSkeletons /> : shown.length === 0 ? (
          <EmptyState icon={Users} title="No clubs found" text="Try a different search or category." />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((c) => <ClubCard key={c._id} club={c} />)}
          </div>
        )}
      </div>
    </>
  );
}
