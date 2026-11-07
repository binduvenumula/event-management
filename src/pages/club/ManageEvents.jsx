import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CalendarPlus, Eye, Pencil, Send, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg, unwrap } from '../../api/axios';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import Spinner from '../../components/Spinner';
import { ConfirmModal } from '../../components/Modal';
import { formatDate, formatTime } from '../../utils/formatDate';

export default function ManageEvents() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';
  const [events, setEvents] = useState(null);
  const [q, setQ] = useState('');
  const [confirm, setConfirm] = useState(null); // { type: 'delete'|'submit', event }
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => api.get('/events/club/mine').then((r) => setEvents(unwrap(r))).catch((e) => { toast.error(errMsg(e)); setEvents([]); }), []);
  useEffect(() => { load(); }, [load]);

  if (!events) return <Spinner />;

  const shown = events.filter((e) => (!status || e.status === status) && (!q || e.title.toLowerCase().includes(q.toLowerCase())));

  const run = async () => {
    setBusy(true);
    try {
      const { type, event } = confirm;
      const res = type === 'delete' ? await api.delete(`/events/${event._id}`) : await api.patch(`/events/${event._id}/submit`);
      toast.success(res.data.message);
      setConfirm(null);
      load();
    } catch (err) {
      toast.error(errMsg(err));
      setConfirm(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">My events</h1>
        <Link to="/club/events/new" className="btn-primary"><CalendarPlus className="h-4 w-4" /> Create event</Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input className="input sm:max-w-xs" placeholder="Search my events..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search events" />
        <div className="flex flex-wrap gap-2">
          {['', 'draft', 'pending', 'approved', 'rejected'].map((s) => (
            <button key={s || 'all'} onClick={() => setParams(s ? { status: s } : {})}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${status === s ? 'bg-royal text-white' : 'bg-white text-slate-600 shadow-card hover:bg-sky'}`}>
              {s || 'All'} ({s ? events.filter((e) => e.status === s).length : events.length})
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <EmptyState icon={CalendarPlus} title="No events found" text="Create your first event and submit it for approval." action={<Link to="/club/events/new" className="btn-primary">Create event</Link>} />
      ) : (
        <div className="card table-wrap">
          <table className="tbl">
            <thead><tr><th>Event</th><th>Date</th><th>Status</th><th>Registered</th><th>Volunteers</th><th className="text-right">Actions</th></tr></thead>
            <tbody>
              {shown.map((e) => (
                <tr key={e._id}>
                  <td className="min-w-[220px]">
                    <p className="font-semibold">{e.title}</p>
                    <p className="text-xs text-muted">{e.category} · {e.venue}</p>
                    {e.status === 'rejected' && <p className="mt-1 rounded bg-red-50 px-2 py-1 text-xs text-red-700"><b>Rejected:</b> {e.rejectionReason}</p>}
                  </td>
                  <td className="whitespace-nowrap">{formatDate(e.date)}<p className="text-xs text-muted">{formatTime(e.startTime)}</p></td>
                  <td><StatusBadge status={e.status} /></td>
                  <td>{e.participantCount}/{e.participantCapacity}</td>
                  <td>{e.isVolunteerNeeded ? <>{e.volunteerCount}/{e.volunteerCapacity}{e.pendingVolunteerCount > 0 && <span className="ml-1 rounded-full bg-amber-100 px-1.5 text-xs font-bold text-amber-800">{e.pendingVolunteerCount} new</span>}</> : <span className="text-slate-400">Not needed</span>}</td>
                  <td>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <Link to={`/events/${e._id}`} className="btn-outline btn-sm" title="Preview"><Eye className="h-3.5 w-3.5" /></Link>
                      {e.status !== 'pending' && <Link to={`/club/events/${e._id}/edit`} className="btn-outline btn-sm" title="Edit"><Pencil className="h-3.5 w-3.5" /></Link>}
                      {['draft', 'rejected'].includes(e.status) && <button className="btn-primary btn-sm" onClick={() => setConfirm({ type: 'submit', event: e })} title="Submit for approval"><Send className="h-3.5 w-3.5" /> Submit</button>}
                      {e.status === 'approved' && <Link to={`/club/events/${e._id}/registrations`} className="btn-outline btn-sm" title="Registrations"><Users className="h-3.5 w-3.5" /> Registrations</Link>}
                      <button className="btn-outline btn-sm text-red-600" onClick={() => setConfirm({ type: 'delete', event: e })} title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirm && (
        <ConfirmModal
          busy={busy} danger={confirm.type === 'delete'} onClose={() => setConfirm(null)} onConfirm={run}
          title={confirm.type === 'delete' ? 'Delete event?' : 'Submit for approval?'}
          confirmLabel={confirm.type === 'delete' ? 'Delete' : 'Submit'}
          message={confirm.type === 'delete'
            ? `"${confirm.event.title}" and all its registrations and announcements will be permanently deleted.`
            : `"${confirm.event.title}" will be sent to the President for review.`}
        />
      )}
    </div>
  );
}
