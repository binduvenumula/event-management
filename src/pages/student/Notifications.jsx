import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg, unwrap } from '../../api/axios';
import EmptyState from '../../components/EmptyState';
import Spinner from '../../components/Spinner';
import { formatDateTime } from '../../utils/formatDate';

// Full notification list - used by every role.
export default function Notifications() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  const load = useCallback(() => api.get('/notifications', { params: { limit: 100 } }).then((r) => setData(unwrap(r))).catch((e) => { toast.error(errMsg(e)); setData({ items: [], unread: 0 }); }), []);
  useEffect(() => { load(); }, [load]);

  if (!data) return <Spinner />;

  const open = async (n) => {
    try {
      if (!n.isRead) await api.patch(`/notifications/${n._id}/read`);
    } catch (e) { toast.error(errMsg(e)); }
    if (n.link) navigate(n.link); else load();
  };
  const markAll = async () => {
    try { await api.patch('/notifications/read-all'); toast.success('All marked as read'); load(); } catch (e) { toast.error(errMsg(e)); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Notifications</h1>
          <p className="text-sm text-muted">{data.unread} unread</p>
        </div>
        <button className="btn-outline" onClick={markAll} disabled={!data.unread}><CheckCheck className="h-4 w-4" /> Mark all as read</button>
      </div>
      {data.items.length === 0 ? <EmptyState icon={Bell} title="No notifications" text="Approvals, announcements and updates will show up here." /> : (
        <ul className="card divide-y divide-slate-100">
          {data.items.map((n) => (
            <li key={n._id}>
              <button onClick={() => open(n)} className={`flex w-full gap-3 px-4 py-4 text-left hover:bg-slate-50 ${n.isRead ? '' : 'bg-sky/40'}`}>
                <span className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${n.isRead ? 'bg-slate-300' : 'bg-royal'}`} />
                <span className="min-w-0">
                  <span className="block font-semibold">{n.title}</span>
                  <span className="block text-sm text-slate-600">{n.message}</span>
                  <span className="mt-1 block text-xs text-slate-400">{formatDateTime(n.createdAt)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
