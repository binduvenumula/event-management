import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg, unwrap } from '../api/axios';
import { formatDateTime } from '../utils/formatDate';

// Bell icon with unread badge. Polls every 60s (no websockets needed for this project).
export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ items: [], unread: 0 });
  const box = useRef(null);

  const load = useCallback(async () => {
    try {
      setData(unwrap(await api.get('/notifications', { params: { limit: 8 } })));
    } catch { /* a 401 is handled globally; other errors are not worth a toast every minute */ }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load]);

  // close on outside click
  useEffect(() => {
    const onClick = (e) => box.current && !box.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const openNotification = async (n) => {
    setOpen(false);
    try {
      if (!n.isRead) await api.patch(`/notifications/${n._id}/read`);
      load();
    } catch (err) { toast.error(errMsg(err)); }
    if (n.link) navigate(n.link);
  };

  const markAll = async () => {
    try {
      await api.patch('/notifications/read-all');
      load();
    } catch (err) { toast.error(errMsg(err)); }
  };

  return (
    <div className="relative" ref={box}>
      <button
        onClick={() => { setOpen(!open); if (!open) load(); }}
        className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100"
        aria-label={`Notifications${data.unread ? `, ${data.unread} unread` : ''}`}
      >
        <Bell className="h-5 w-5" />
        {data.unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
            {data.unread > 9 ? '9+' : data.unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed left-2 right-2 top-16 z-50 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-slate-200 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-96">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h3 className="font-semibold">Notifications</h3>
            <button onClick={markAll} disabled={!data.unread} className="flex items-center gap-1 text-xs font-medium text-royal disabled:text-slate-400">
              <CheckCheck className="h-4 w-4" /> Mark all as read
            </button>
          </div>
          <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
            {data.items.length === 0 && <li className="px-4 py-8 text-center text-sm text-muted">You're all caught up.</li>}
            {data.items.map((n) => (
              <li key={n._id}>
                <button onClick={() => openNotification(n)} className={`flex w-full gap-3 px-4 py-3 text-left hover:bg-slate-50 ${n.isRead ? '' : 'bg-sky/40'}`}>
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.isRead ? 'bg-transparent' : 'bg-royal'}`} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ink">{n.title}</span>
                    <span className="line-clamp-2 text-xs text-muted">{n.message}</span>
                    <span className="mt-0.5 block text-[11px] text-slate-400">{formatDateTime(n.createdAt)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <Link to="/notifications" onClick={() => setOpen(false)} className="block border-t border-slate-100 py-2.5 text-center text-sm font-medium text-royal hover:bg-slate-50">
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
