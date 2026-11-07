import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg, unwrap } from '../../api/axios';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import Spinner from '../../components/Spinner';
import { formatDateTime } from '../../utils/formatDate';

// Participation registrations of one event, with search, status filter and CSV export.
export default function EventRegistrations() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() =>
    api.get(`/events/${id}/participants`, { params: { q: q || undefined, status: status || undefined } })
      .then((r) => setData(unwrap(r)))
      .catch((e) => { toast.error(errMsg(e)); setData({ event: {}, registrations: [], error: true }); }),
  [id, q, status]);

  // small debounce for the search box
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const exportCsv = async () => {
    setBusy(true);
    try {
      const res = await api.get(`/events/${id}/participants/export`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(data.event.title || 'event').replace(/[^a-z0-9]+/gi, '_')}_participants.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV downloaded');
    } catch (err) {
      toast.error(errMsg(err, 'Export failed'));
    } finally {
      setBusy(false);
    }
  };

  if (!data) return <Spinner />;
  const regs = data.registrations;
  const registered = regs.filter((r) => r.status === 'registered').length;

  return (
    <div className="space-y-5">
      <Link to="/club/events" className="inline-flex items-center gap-1 text-sm font-medium text-royal"><ArrowLeft className="h-4 w-4" /> My events</Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">{data.event.title || 'Registrations'}</h1>
          <p className="text-sm text-muted">Participants · {registered} registered{data.event.participantCapacity ? ` of ${data.event.participantCapacity} seats` : ''}</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/club/volunteers?event=${id}`} className="btn-outline">Volunteers</Link>
          <button className="btn-primary" onClick={exportCsv} disabled={busy || !regs.length}><Download className="h-4 w-4" /> {busy ? 'Exporting...' : 'Export CSV'}</button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input className="input sm:max-w-xs" placeholder="Search name, email or roll no..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search participants" />
        <select className="input sm:max-w-[200px]" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="">All statuses</option><option value="registered">Registered</option><option value="cancelled">Cancelled</option>
        </select>
      </div>

      {regs.length === 0 ? (
        <EmptyState icon={Users} title="No registrations found" text={q || status ? 'Try changing your search or filter.' : 'Nobody has registered yet.'} />
      ) : (
        <div className="card table-wrap">
          <table className="tbl">
            <thead><tr><th>Student</th><th>Roll no.</th><th>Branch / Year</th><th>Phone</th><th>Team</th><th>Registered</th><th>Status</th></tr></thead>
            <tbody>
              {regs.map((r) => (
                <tr key={r._id}>
                  <td className="min-w-[180px]"><p className="font-semibold">{r.student?.name}</p><p className="text-xs text-muted">{r.student?.email}</p></td>
                  <td>{r.student?.rollNumber}</td>
                  <td className="whitespace-nowrap">{r.student?.branch} / Y{r.student?.year}</td>
                  <td>{r.phone}</td>
                  <td>{r.teamName || '-'}{r.additionalInfo && <p className="max-w-[200px] truncate text-xs text-muted" title={r.additionalInfo}>{r.additionalInfo}</p>}</td>
                  <td className="whitespace-nowrap">{formatDateTime(r.createdAt)}</td>
                  <td><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
