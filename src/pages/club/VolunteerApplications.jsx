import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg, unwrap } from '../../api/axios';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import Spinner from '../../components/Spinner';
import VolunteerReviewModal from '../../components/VolunteerReviewModal';
import { formatDateTime } from '../../utils/formatDate';

// Volunteer applications across all (or one) of the club's events.
export default function VolunteerApplications() {
  const [params, setParams] = useSearchParams();
  const eventId = params.get('event') || '';
  const [events, setEvents] = useState(null);
  const [regs, setRegs] = useState(null);
  const [status, setStatus] = useState('pending');
  const [q, setQ] = useState('');
  const [review, setReview] = useState(null);

  useEffect(() => {
    api.get('/events/club/mine').then((r) => setEvents(unwrap(r).filter((e) => e.isVolunteerNeeded && e.status === 'approved')))
      .catch((e) => { toast.error(errMsg(e)); setEvents([]); });
  }, []);

  const load = useCallback(async () => {
    if (!events) return;
    try {
      const targets = eventId ? events.filter((e) => e._id === eventId) : events;
      const lists = await Promise.all(targets.map((e) =>
        api.get(`/events/${e._id}/volunteers`, { params: { q: q || undefined } }).then((r) => unwrap(r).registrations.map((x) => ({ ...x, event: { _id: e._id, title: e.title } })))));
      setRegs(lists.flat().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) {
      toast.error(errMsg(err));
      setRegs([]);
    }
  }, [events, eventId, q]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  if (!events || !regs) return <Spinner />;
  const shown = regs.filter((r) => !status || r.status === status);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">Volunteer applications</h1>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <select className="input" value={eventId} onChange={(e) => setParams(e.target.value ? { event: e.target.value } : {})} aria-label="Event">
          <option value="">All events</option>
          {events.map((e) => <option key={e._id} value={e._id}>{e.title}</option>)}
        </select>
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="">All statuses</option>
          {['pending', 'approved', 'rejected', 'withdrawn'].map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
        <input className="input" placeholder="Search student..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
      </div>

      {events.length === 0 ? (
        <EmptyState icon={Heart} title="No events need volunteers" text="Approved events that ask for volunteers will show applications here." />
      ) : shown.length === 0 ? (
        <EmptyState icon={Heart} title="No applications found" text="Try a different status or event." />
      ) : (
        <div className="card table-wrap">
          <table className="tbl">
            <thead><tr><th>Student</th><th>Event</th><th>Role</th><th>Availability</th><th>Applied</th><th>Status</th><th className="text-right">Action</th></tr></thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r._id}>
                  <td className="min-w-[160px]"><p className="font-semibold">{r.student?.name}</p><p className="text-xs text-muted">{r.student?.rollNumber} · {r.student?.branch}</p></td>
                  <td className="min-w-[160px]">{r.event.title}</td>
                  <td>{r.preferredRole}</td>
                  <td className="max-w-[180px] truncate" title={r.availability}>{r.availability}</td>
                  <td className="whitespace-nowrap">{formatDateTime(r.createdAt)}</td>
                  <td><StatusBadge status={r.status} />{r.reviewNote && <p className="mt-1 max-w-[160px] truncate text-xs text-muted" title={r.reviewNote}>{r.reviewNote}</p>}</td>
                  <td className="text-right">
                    {r.status === 'withdrawn' ? <span className="text-xs text-slate-400">-</span> : <button className="btn-outline btn-sm" onClick={() => setReview(r)}>{r.status === 'pending' ? 'Review' : 'Change'}</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {review && <VolunteerReviewModal reg={review} onClose={() => setReview(null)} onDone={load} />}
    </div>
  );
}
