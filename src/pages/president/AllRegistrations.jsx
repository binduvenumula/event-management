import { useCallback, useEffect, useMemo, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg, unwrap } from '../../api/axios';
import EmptyState from '../../components/EmptyState';
import Spinner from '../../components/Spinner';
import StatusBadge from '../../components/StatusBadge';
import { formatDate, formatDateTime } from '../../utils/formatDate';

const STATUSES = { participation: ['registered', 'cancelled'], volunteer: ['pending', 'approved', 'rejected', 'withdrawn'] };

// Registrations monitor: participation and volunteer records are kept in separate tabs.
export default function AllRegistrations() {
  const [type, setType] = useState('participation');
  const [f, setF] = useState({ club: '', event: '', status: '' });
  const [q, setQ] = useState('');
  const [clubs, setClubs] = useState([]);
  const [events, setEvents] = useState([]);
  const [regs, setRegs] = useState(null);

  useEffect(() => {
    api.get('/clubs', { params: { all: true } }).then((r) => setClubs(unwrap(r))).catch(() => {});
    api.get('/events/admin/all', { params: { status: 'approved' } }).then((r) => setEvents(unwrap(r))).catch(() => {});
  }, []);

  const load = useCallback(() => {
    setRegs(null);
    return api.get('/registrations/admin/all', { params: { type, club: f.club || undefined, event: f.event || undefined, status: f.status || undefined } })
      .then((r) => setRegs(unwrap(r))).catch((e) => { toast.error(errMsg(e)); setRegs([]); });
  }, [type, f]);
  useEffect(() => { load(); }, [load]);

  const eventOptions = useMemo(() => events.filter((e) => !f.club || e.club?._id === f.club), [events, f.club]);
  const shown = (regs || []).filter((r) => !q || `${r.student.name} ${r.student.email} ${r.student.rollNumber}`.toLowerCase().includes(q.toLowerCase()));
  const isVol = type === 'volunteer';

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">Registrations monitor</h1>

      <div className="flex gap-2 border-b border-slate-200" role="tablist">
        {[['participation', 'Participation'], ['volunteer', 'Volunteering']].map(([k, label]) => (
          <button key={k} role="tab" aria-selected={type === k} onClick={() => { setType(k); setF({ ...f, status: '' }); }}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold ${type === k ? 'border-royal text-royal' : 'border-transparent text-muted hover:text-ink'}`}>{label}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <select className="input" value={f.club} onChange={(e) => setF({ club: e.target.value, event: '', status: f.status })} aria-label="Club">
          <option value="">All clubs</option>{clubs.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select className="input" value={f.event} onChange={(e) => setF({ ...f, event: e.target.value })} aria-label="Event">
          <option value="">All events</option>{eventOptions.map((e) => <option key={e._id} value={e._id}>{e.title}</option>)}
        </select>
        <select className="input" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} aria-label="Status">
          <option value="">All statuses</option>{STATUSES[type].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input className="input" placeholder="Search student..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search student" />
      </div>

      {!regs ? <Spinner /> : shown.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No registrations found" text="Try changing the filters." />
      ) : (
        <>
          <p className="text-sm text-muted">{shown.length} record{shown.length === 1 ? '' : 's'}</p>
          <div className="card table-wrap">
            <table className="tbl">
              <thead><tr><th>Student</th><th>Event</th><th>Club</th>{isVol ? <th>Role</th> : <th>Team</th>}<th>Date</th><th>Submitted</th><th>Status</th></tr></thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r._id}>
                    <td className="min-w-[170px]"><p className="font-semibold">{r.student.name}</p><p className="text-xs text-muted">{r.student.rollNumber} · {r.student.branch}</p></td>
                    <td className="min-w-[180px]">{r.event.title}</td>
                    <td>{r.event.club?.name}</td>
                    <td>{isVol ? r.preferredRole : r.teamName || '-'}</td>
                    <td className="whitespace-nowrap">{formatDate(r.event.date)}</td>
                    <td className="whitespace-nowrap">{formatDateTime(r.createdAt)}</td>
                    <td><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
