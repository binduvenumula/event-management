import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg, unwrap } from '../../api/axios';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import Spinner from '../../components/Spinner';
import { ConfirmModal } from '../../components/Modal';
import { formatDate, formatDateTime, formatTime } from '../../utils/formatDate';

// Two separate tabs: participation and volunteering.
export default function MyRegistrations() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'volunteer' ? 'volunteer' : 'participation';
  const [all, setAll] = useState(null);
  const [confirm, setConfirm] = useState(null); // registration being cancelled / withdrawn
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => api.get('/registrations/mine').then((r) => setAll(unwrap(r))).catch((e) => { toast.error(errMsg(e)); setAll([]); }), []);
  useEffect(() => { load(); }, [load]);

  if (!all) return <Spinner />;
  const list = all.filter((r) => r.type === tab);
  const counts = { participation: all.filter((r) => r.type === 'participation').length, volunteer: all.filter((r) => r.type === 'volunteer').length };

  const undo = async () => {
    setBusy(true);
    try {
      const res = await api.delete(`/events/${confirm.event._id}/${confirm.type === 'participation' ? 'participate' : 'volunteer'}`);
      toast.success(res.data.message);
      setConfirm(null);
      load();
    } catch (err) {
      toast.error(errMsg(err));
      setConfirm(null);
      load();
    } finally {
      setBusy(false);
    }
  };

  // Participation can be cancelled before the deadline, volunteer applications while pending.
  const canUndo = (r) =>
    r.type === 'participation'
      ? r.status === 'registered' && new Date() <= new Date(r.event.registrationDeadline) && new Date(r.event.date) >= new Date(new Date().toISOString().slice(0, 10))
      : r.status === 'pending';

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">My registrations</h1>

      <div className="flex gap-2 border-b border-slate-200" role="tablist">
        {[['participation', 'Participation'], ['volunteer', 'Volunteering']].map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setParams(k === 'volunteer' ? { tab: 'volunteer' } : {})}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold ${tab === k ? 'border-royal text-royal' : 'border-transparent text-muted hover:text-ink'}`}>
            {label} <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs">{counts[k]}</span>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState icon={ClipboardList} title={tab === 'volunteer' ? 'No volunteer applications' : 'No event registrations'}
          text="Browse events and join the ones you like." action={<Link to="/events" className="btn-primary">Browse events</Link>} />
      ) : (
        <div className="card table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Event</th><th>Date</th>
                {tab === 'volunteer' ? <><th>Role</th><th>Note from club</th></> : <><th>Team</th><th>Registered on</th></>}
                <th>Status</th><th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r._id}>
                  <td className="min-w-[200px]">
                    <Link to={`/events/${r.event._id}`} className="font-semibold hover:text-royal">{r.event.title}</Link>
                    <p className="text-xs text-muted">{r.event.club?.name}</p>
                  </td>
                  <td className="whitespace-nowrap">{formatDate(r.event.date)}<p className="text-xs text-muted">{formatTime(r.event.startTime)}</p></td>
                  {tab === 'volunteer' ? (
                    <><td>{r.preferredRole}</td><td className="max-w-[220px] text-xs text-muted">{r.reviewNote || '-'}</td></>
                  ) : (
                    <><td>{r.teamName || '-'}</td><td className="whitespace-nowrap">{formatDateTime(r.createdAt)}</td></>
                  )}
                  <td><StatusBadge status={r.status} /></td>
                  <td className="text-right">
                    {canUndo(r) ? (
                      <button className="btn-outline btn-sm text-red-600" onClick={() => setConfirm(r)}>{r.type === 'participation' ? 'Cancel' : 'Withdraw'}</button>
                    ) : <span className="text-xs text-slate-400">-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirm && (
        <ConfirmModal danger busy={busy} onClose={() => setConfirm(null)} onConfirm={undo}
          title={confirm.type === 'participation' ? 'Cancel registration?' : 'Withdraw application?'}
          confirmLabel={confirm.type === 'participation' ? 'Yes, cancel' : 'Yes, withdraw'}
          message={`${confirm.event.title} - ${confirm.type === 'participation' ? 'your seat will be released.' : 'your application will be withdrawn.'}`} />
      )}
    </div>
  );
}
