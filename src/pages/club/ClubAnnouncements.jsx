import { useCallback, useEffect, useState } from 'react';
import { Megaphone, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg, unwrap } from '../../api/axios';
import EmptyState from '../../components/EmptyState';
import Spinner from '../../components/Spinner';
import { formatDateTime } from '../../utils/formatDate';

export default function ClubAnnouncements() {
  const [events, setEvents] = useState(null);
  const [items, setItems] = useState(null);
  const [form, setForm] = useState({ event: '', title: '', message: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => api.get('/events/club/announcements').then((r) => setItems(unwrap(r))).catch((e) => { toast.error(errMsg(e)); setItems([]); }), []);
  useEffect(() => {
    load();
    api.get('/events/club/mine', { params: { status: 'approved' } }).then((r) => setEvents(unwrap(r))).catch(() => setEvents([]));
  }, [load]);

  const set = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setErrors({ ...errors, [k]: '' }); };

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!form.event) er.event = 'Choose an event';
    if (!form.title.trim()) er.title = 'Title is required';
    if (!form.message.trim()) er.message = 'Message is required';
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      const res = await api.post(`/events/${form.event}/announcements`, { title: form.title, message: form.message });
      toast.success(res.data.message);
      setForm({ ...form, title: '', message: '' });
      load();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  if (!events || !items) return <Spinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Announcements</h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <form onSubmit={submit} noValidate className="card space-y-4 p-5 lg:col-span-2 lg:self-start">
          <h2 className="font-bold">Post an announcement</h2>
          <p className="text-xs text-muted">Registered participants and approved volunteers get a notification.</p>
          <div>
            <label className="label" htmlFor="event">Event</label>
            <select id="event" className={`input ${errors.event ? 'input-error' : ''}`} value={form.event} onChange={set('event')}>
              <option value="">Select an approved event</option>
              {events.map((e) => <option key={e._id} value={e._id}>{e.title}</option>)}
            </select>
            {errors.event && <p className="field-error">{errors.event}</p>}
          </div>
          <div>
            <label className="label" htmlFor="title">Title</label>
            <input id="title" className={`input ${errors.title ? 'input-error' : ''}`} maxLength={120} value={form.title} onChange={set('title')} />
            {errors.title && <p className="field-error">{errors.title}</p>}
          </div>
          <div>
            <label className="label" htmlFor="message">Message</label>
            <textarea id="message" rows={4} maxLength={1000} className={`input ${errors.message ? 'input-error' : ''}`} value={form.message} onChange={set('message')} />
            {errors.message && <p className="field-error">{errors.message}</p>}
          </div>
          <button className="btn-primary w-full" disabled={busy}><Send className="h-4 w-4" /> {busy ? 'Posting...' : 'Post announcement'}</button>
        </form>

        <section className="space-y-3 lg:col-span-3">
          {items.length === 0 ? <EmptyState icon={Megaphone} title="No announcements yet" text="Your posted announcements will be listed here." /> : items.map((a) => (
            <article key={a._id} className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-bold">{a.title}</h3>
                <span className="chip">{a.event?.title}</span>
              </div>
              <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{a.message}</p>
              <p className="mt-2 text-xs text-slate-400">{formatDateTime(a.createdAt)}</p>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
