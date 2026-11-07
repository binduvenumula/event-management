import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CalendarCheck, CalendarDays, CheckCircle2, Clock, Heart } from 'lucide-react';
import api, { errMsg, unwrap } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/StatCard';
import EmptyState from '../../components/EmptyState';
import Spinner from '../../components/Spinner';
import { formatDate, formatDateTime, formatTime } from '../../utils/formatDate';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [d, setD] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { api.get('/stats/student').then((r) => setD(unwrap(r))).catch((e) => setError(errMsg(e))); }, []);

  if (error) return <EmptyState title="Could not load dashboard" text={error} />;
  if (!d) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">Hello, {user.name.split(' ')[0]} 👋</h1>
        <p className="text-sm text-muted">{user.branch} · Year {user.year} · {user.rollNumber}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Upcoming registered events" value={d.upcomingCount} icon={CalendarCheck} />
        <StatCard label="Events attended" value={d.attendedCount} icon={CheckCircle2} tone="bg-emerald-100 text-emerald-700" />
        <StatCard label="Volunteer applications" value={d.volunteer.pending + d.volunteer.approved + d.volunteer.rejected} icon={Heart} tone="bg-amber-100 text-amber-700" hint={`${d.volunteer.approved} approved`} />
        <StatCard label="Unread notifications" value={d.unread} icon={Bell} tone="bg-red-100 text-red-700" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">Upcoming registered events</h2>
            <Link to="/student/registrations" className="text-sm font-semibold text-royal">View all</Link>
          </div>
          {d.upcomingEvents.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No upcoming registrations" text="Find an event you like and register." action={<Link to="/events" className="btn-primary">Browse events</Link>} />
          ) : (
            <ul className="divide-y divide-slate-100">
              {d.upcomingEvents.map((r) => (
                <li key={r._id} className="flex items-center gap-4 py-3">
                  <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-sky text-navy">
                    <span className="text-lg font-extrabold leading-none">{new Date(r.event.date).getUTCDate()}</span>
                    <span className="text-[11px] font-semibold uppercase">{formatDate(r.event.date).split(' ')[1]}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link to={`/events/${r.event._id}`} className="block truncate font-semibold hover:text-royal">{r.event.title}</Link>
                    <p className="truncate text-xs text-muted">{r.event.club?.name} · {formatTime(r.event.startTime)} · {r.event.venue}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5">
          <h2 className="mb-3 font-bold">Volunteer status</h2>
          <ul className="space-y-2 text-sm">
            {[['Pending', d.volunteer.pending, 'bg-amber-100 text-amber-800'], ['Approved', d.volunteer.approved, 'bg-emerald-100 text-emerald-700'], ['Rejected', d.volunteer.rejected, 'bg-red-100 text-red-700'], ['Withdrawn', d.volunteer.withdrawn, 'bg-slate-200 text-slate-600']].map(([l, n, c]) => (
              <li key={l} className="flex items-center justify-between"><span>{l}</span><span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${c}`}>{n}</span></li>
            ))}
          </ul>
          <Link to="/student/registrations?tab=volunteer" className="btn-outline mt-4 w-full">Manage applications</Link>
        </section>
      </div>

      <section className="card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold">Recent notifications</h2>
          <Link to="/notifications" className="text-sm font-semibold text-royal">See all</Link>
        </div>
        {d.recentNotifications.length === 0 ? <p className="text-sm text-muted">No notifications yet.</p> : (
          <ul className="divide-y divide-slate-100">
            {d.recentNotifications.map((n) => (
              <li key={n._id} className="flex gap-3 py-3">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.isRead ? 'bg-slate-300' : 'bg-royal'}`} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{n.title}</p>
                  <p className="line-clamp-1 text-xs text-muted">{n.message}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400"><Clock className="h-3 w-3" /> {formatDateTime(n.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
