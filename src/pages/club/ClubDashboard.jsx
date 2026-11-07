import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, CalendarDays, Heart, Plus, Users } from 'lucide-react';
import api, { errMsg, unwrap } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import Spinner from '../../components/Spinner';
import VolunteerReviewModal from '../../components/VolunteerReviewModal';
import { formatDate } from '../../utils/formatDate';

export default function ClubDashboard() {
  const { user } = useAuth();
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  const [review, setReview] = useState(null);

  const load = useCallback(() => api.get('/stats/club').then((r) => setD(unwrap(r))).catch((e) => setError(errMsg(e))), []);
  useEffect(() => { load(); }, [load]);

  if (error) return <EmptyState title="Could not load dashboard" text={error} />;
  if (!d) return <Spinner />;

  const maxReg = Math.max(1, ...d.registrationsPerEvent.map((e) => Math.max(e.capacity, e.participants)));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">{user.club?.name}</h1>
          <p className="text-sm text-muted">Club head dashboard</p>
        </div>
        <Link to="/club/events/new" className="btn-primary"><Plus className="h-4 w-4" /> Create event</Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total events" value={d.totalEvents} icon={CalendarDays} />
        <StatCard label="Upcoming (approved)" value={d.upcoming} icon={CalendarCheck} tone="bg-emerald-100 text-emerald-700" />
        <StatCard label="Participants registered" value={d.participants} icon={Users} tone="bg-violet-100 text-violet-700" />
        <StatCard label="Pending volunteer requests" value={d.pendingVolunteers} icon={Heart} tone="bg-amber-100 text-amber-700" hint={`${d.approvedVolunteers} approved`} />
      </div>

      <section className="card p-5">
        <h2 className="mb-3 font-bold">My events by status</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {['draft', 'pending', 'approved', 'rejected'].map((s) => (
            <Link key={s} to={`/club/events?status=${s}`} className="rounded-xl border border-slate-200 p-3 text-center transition hover:border-royal hover:shadow-card">
              <p className="text-2xl font-extrabold">{d.byStatus[s]}</p>
              <StatusBadge status={s} />
            </Link>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-3 font-bold">Registrations per event</h2>
          {d.registrationsPerEvent.length === 0 ? <p className="text-sm text-muted">Approved events will appear here.</p> : (
            <ul className="space-y-4">
              {d.registrationsPerEvent.map((e) => (
                <li key={e._id}>
                  <div className="mb-1 flex justify-between gap-2 text-sm">
                    <Link to={`/club/events/${e._id}/registrations`} className="truncate font-medium hover:text-royal">{e.title}</Link>
                    <span className="shrink-0 text-xs text-muted">{e.participants}/{e.capacity} · {e.volunteers} vol.</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-royal" style={{ width: `${(e.participants / maxReg) * 100}%` }} />
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-400">{formatDate(e.date)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">Pending volunteer applications</h2>
            <Link to="/club/volunteers" className="text-sm font-semibold text-royal">View all</Link>
          </div>
          {d.pendingVolunteerList.length === 0 ? <p className="text-sm text-muted">No applications waiting for review.</p> : (
            <ul className="divide-y divide-slate-100">
              {d.pendingVolunteerList.map((r) => (
                <li key={r._id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{r.student?.name} <span className="font-normal text-muted">· {r.preferredRole}</span></p>
                    <p className="truncate text-xs text-muted">{r.event?.title}</p>
                  </div>
                  <button className="btn-outline btn-sm shrink-0" onClick={() => setReview(r)}>Review</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {review && <VolunteerReviewModal reg={review} onClose={() => setReview(null)} onDone={load} />}
    </div>
  );
}
