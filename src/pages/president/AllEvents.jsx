import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg, unwrap } from '../../api/axios';
import EmptyState from '../../components/EmptyState';
import Spinner from '../../components/Spinner';
import StatusBadge from '../../components/StatusBadge';
import EventReviewModal from '../../components/EventReviewModal';
import { formatDate, formatTime } from '../../utils/formatDate';

export default function AllEvents() {
  const [events, setEvents] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [f, setF] = useState({ status: '', club: '', q: '' });
  const [review, setReview] = useState(null);

  useEffect(() => { api.get('/clubs', { params: { all: true } }).then((r) => setClubs(unwrap(r))).catch(() => {}); }, []);

  const load = useCallback(() =>
    api.get('/events/admin/all', { params: { status: f.status || undefined, club: f.club || undefined, q: f.q || undefined } })
      .then((r) => setEvents(unwrap(r))).catch((e) => { toast.error(errMsg(e)); setEvents([]); }),
  [f]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">All events</h1>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <input className="input" placeholder="Search by title..." value={f.q} onChange={set('q')} aria-label="Search" />
        <select className="input" value={f.club} onChange={set('club')} aria-label="Club">
          <option value="">All clubs</option>{clubs.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select className="input" value={f.status} onChange={set('status')} aria-label="Status">
          <option value="">All statuses</option>{['draft', 'pending', 'approved', 'rejected'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {!events ? <Spinner /> : events.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No events match" text="Try changing the filters." />
      ) : (
        <div className="card table-wrap">
          <table className="tbl">
            <thead><tr><th>Event</th><th>Club</th><th>Date</th><th>Status</th><th>Participants</th><th>Volunteers</th><th className="text-right">Actions</th></tr></thead>
            <tbody>
              {events.map((e) => (
                <tr key={e._id}>
                  <td className="min-w-[220px]"><p className="font-semibold">{e.title}</p><p className="text-xs text-muted">{e.category}</p></td>
                  <td>{e.club?.name}</td>
                  <td className="whitespace-nowrap">{formatDate(e.date)}<p className="text-xs text-muted">{formatTime(e.startTime)}</p></td>
                  <td><StatusBadge status={e.status} /></td>
                  <td>{e.participantCount}/{e.participantCapacity}</td>
                  <td>{e.isVolunteerNeeded ? `${e.volunteerCount}/${e.volunteerCapacity}` : '-'}</td>
                  <td>
                    <div className="flex justify-end gap-1.5">
                      <Link to={`/events/${e._id}`} className="btn-outline btn-sm" title="Open public page"><Eye className="h-3.5 w-3.5" /></Link>
                      <button className="btn-outline btn-sm" onClick={() => setReview(e)}>{e.status === 'pending' ? 'Review' : 'Details'}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {review && <EventReviewModal event={review} onClose={() => setReview(null)} onDone={load} />}
    </div>
  );
}
