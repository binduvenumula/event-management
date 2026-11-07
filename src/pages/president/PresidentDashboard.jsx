import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, CalendarDays, Clock, GraduationCap, Heart, ShieldCheck, Ticket, Users } from 'lucide-react';
import api, { errMsg, unwrap } from '../../api/axios';
import StatCard from '../../components/StatCard';
import EmptyState from '../../components/EmptyState';
import Spinner from '../../components/Spinner';
import EventReviewModal from '../../components/EventReviewModal';
import { formatDate } from '../../utils/formatDate';

export default function PresidentDashboard() {
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [error, setError] = useState('');
  const [review, setReview] = useState(null);

  const load = useCallback(async () => {
    try {
      const [s, p] = await Promise.all([api.get('/stats/president'), api.get('/events/admin/all', { params: { status: 'pending' } })]);
      setStats(unwrap(s));
      setPending(unwrap(p));
    } catch (e) { setError(errMsg(e)); }
  }, []);
  useEffect(() => { load(); }, [load]);

  if (error) return <EmptyState title="Could not load dashboard" text={error} />;
  if (!stats) return <Spinner />;

  const rows = stats.registrationsPerClub;
  const max = Math.max(1, ...rows.map((r) => r.participants + r.volunteers));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">President dashboard</h1>
        <p className="text-sm text-muted">Overview of every club, event and registration on campus.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total clubs" value={stats.totalClubs} icon={Users} />
        <StatCard label="Total events" value={stats.totalEvents} icon={CalendarDays} />
        <StatCard label="Pending approvals" value={stats.pendingApprovals} icon={Clock} tone="bg-amber-100 text-amber-700" />
        <StatCard label="Approved events" value={stats.approvedEvents} icon={CalendarCheck} tone="bg-emerald-100 text-emerald-700" />
        <StatCard label="Total students" value={stats.totalStudents} icon={GraduationCap} tone="bg-violet-100 text-violet-700" />
        <StatCard label="Total participants" value={stats.totalParticipants} icon={Ticket} />
        <StatCard label="Approved volunteers" value={stats.totalVolunteers} icon={Heart} tone="bg-rose-100 text-rose-700" hint={`${stats.pendingVolunteers} pending`} />
        <Link to="/president/approvals" className="card card-hover flex items-center gap-4 bg-royal p-4 text-white">
          <ShieldCheck className="h-8 w-8" /><div><p className="font-bold">Review queue</p><p className="text-sm text-blue-100">{stats.pendingApprovals} waiting</p></div>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <section className="card p-5 xl:col-span-3">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-bold">Registrations per club</h2>
            <div className="flex gap-3 text-xs text-muted">
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-royal" /> Participants</span>
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded bg-accent" /> Volunteers</span>
            </div>
          </div>
          <ul className="space-y-3">
            {rows.map((r) => (
              <li key={r.club}>
                <div className="mb-1 flex justify-between text-sm"><span className="truncate font-medium">{r.club}</span><span className="text-xs text-muted">{r.participants} + {r.volunteers}</span></div>
                <div className="flex h-3 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${r.club}: ${r.participants} participants, ${r.volunteers} volunteers`}>
                  <div className="bg-royal" style={{ width: `${(r.participants / max) * 100}%` }} />
                  <div className="bg-accent" style={{ width: `${(r.volunteers / max) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5 xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">Pending approvals</h2>
            <Link to="/president/approvals" className="text-sm font-semibold text-royal">View all</Link>
          </div>
          {pending.length === 0 ? <p className="text-sm text-muted">All caught up - nothing to review.</p> : (
            <ul className="divide-y divide-slate-100">
              {pending.slice(0, 5).map((e) => (
                <li key={e._id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{e.title}</p>
                    <p className="truncate text-xs text-muted">{e.club?.name} · {formatDate(e.date)}</p>
                  </div>
                  <button className="btn-outline btn-sm shrink-0" onClick={() => setReview(e)}>Review</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      {review && <EventReviewModal event={review} onClose={() => setReview(null)} onDone={load} />}
    </div>
  );
}
