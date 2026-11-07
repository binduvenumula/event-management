import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Clock, Hourglass, Megaphone, MapPin, Tag, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg, unwrap } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import PosterImage from '../../components/PosterImage';
import RegistrationModal from '../../components/RegistrationModal';
import StatusBadge from '../../components/StatusBadge';
import { ConfirmModal } from '../../components/Modal';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import { formatDate, formatDateTime, formatTime, timeLeft } from '../../utils/formatDate';
import { participationState, seatBadge, seatsLeft, volunteerState } from '../../utils/eventState';

export default function EventDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [event, setEvent] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null);   // 'participation' | 'volunteer'
  const [confirm, setConfirm] = useState(null); // 'cancel' | 'withdraw'
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [e, a] = await Promise.all([api.get(`/events/${id}`), api.get(`/events/${id}/announcements`)]);
      setEvent(unwrap(e));
      setAnnouncements(unwrap(a));
      setError('');
    } catch (err) {
      setError(err.response?.status === 404 ? 'This event does not exist or is not available.' : errMsg(err));
    }
  }, [id]);

  useEffect(() => { setEvent(null); load(); }, [load, user?._id]);

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState title="Event not found" text={error} action={<Link to="/events" className="btn-primary">Browse events</Link>} />
      </div>
    );
  }
  if (!event) return <Spinner className="min-h-[60vh]" />;

  const p = participationState(event, user);
  const v = volunteerState(event, user);
  const badge = seatBadge(event);
  const pct = Math.min(100, Math.round(((event.participantCount || 0) / event.participantCapacity) * 100));
  const notLive = event.status !== 'approved';

  const start = (type) => {
    if (!user) {
      toast('Please log in to continue');
      return navigate('/login', { state: { from: location.pathname } });
    }
    setModal(type);
  };

  const undo = async () => {
    setBusy(true);
    try {
      const path = confirm === 'cancel' ? 'participate' : 'volunteer';
      const res = await api.delete(`/events/${event._id}/${path}`);
      toast.success(res.data.message);
      setConfirm(null);
      load();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const info = [
    { icon: CalendarDays, label: 'Date', value: formatDate(event.date) },
    { icon: Clock, label: 'Time', value: `${formatTime(event.startTime)} - ${formatTime(event.endTime)}` },
    { icon: MapPin, label: 'Venue', value: event.venue },
    { icon: Hourglass, label: 'Register by', value: `${formatDateTime(event.registrationDeadline)} (${timeLeft(event.registrationDeadline)})` },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Link to="/events" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-royal"><ArrowLeft className="h-4 w-4" /> All events</Link>

      {notLive && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <StatusBadge status={event.status} /> This event is not public yet - only you can see this preview.
          {event.rejectionReason && <span>Reason: {event.rejectionReason}</span>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="card overflow-hidden">
            <PosterImage src={event.poster} title={event.title} className="aspect-video w-full" />
            <div className="p-5 sm:p-6">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="chip">{event.category}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${badge.tone}`}>{badge.text}</span>
              </div>
              <h1 className="text-2xl font-extrabold sm:text-3xl">{event.title}</h1>
              {event.club && (
                <Link to={`/clubs/${event.club.slug || event.club._id}`} className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-royal hover:underline">
                  <Users className="h-4 w-4" /> {event.club.name}
                </Link>
              )}
              <h2 className="mt-5 text-lg font-bold">About this event</h2>
              <p className="mt-1 whitespace-pre-line text-slate-700">{event.description}</p>
              {event.tags?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {event.tags.map((t) => <span key={t} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600"><Tag className="h-3 w-3" />{t}</span>)}
                </div>
              )}
            </div>
          </div>

          <div className="card p-5 sm:p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><Megaphone className="h-5 w-5 text-royal" /> Announcements</h2>
            {announcements.length === 0 ? (
              <p className="text-sm text-muted">No announcements yet.</p>
            ) : (
              <ol className="relative space-y-5 border-l-2 border-sky pl-5">
                {announcements.map((a) => (
                  <li key={a._id} className="relative">
                    <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-white bg-royal" />
                    <p className="font-semibold">{a.title}</p>
                    <p className="text-sm text-slate-700">{a.message}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{formatDateTime(a.createdAt)}{a.createdBy?.name ? ` · ${a.createdBy.name}` : ''}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        {/* side panel */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card space-y-4 p-5">
            <ul className="space-y-3">
              {info.map(({ icon: Icon, label, value }) => (
                <li key={label} className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky text-royal"><Icon className="h-4 w-4" /></div>
                  <div className="min-w-0"><p className="text-xs text-muted">{label}</p><p className="text-sm font-semibold">{value}</p></div>
                </li>
              ))}
            </ul>

            <div>
              <div className="mb-1 flex justify-between text-xs text-muted">
                <span>{event.participantCount} / {event.participantCapacity} registered</span>
                <span>{seatsLeft(event)} left</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                <div className={`h-full rounded-full ${pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-accent' : 'bg-royal'}`} style={{ width: `${pct}%` }} />
              </div>
            </div>

            {event.isVolunteerNeeded && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Volunteers needed: {event.volunteerCount} / {event.volunteerCapacity} approved
              </p>
            )}

            <div className="space-y-2 border-t border-slate-100 pt-4">
              <button className={`w-full ${p.done ? 'btn-success' : 'btn-primary'}`} disabled={p.disabled || notLive} title={p.reason} onClick={() => start('participation')}>
                {p.label}
              </button>
              {p.reason && !p.done && <p className="text-center text-xs text-red-600">{p.reason}</p>}
              {event.myParticipation === 'registered' && !event.registrationClosed && (
                <button className="btn-outline w-full" onClick={() => setConfirm('cancel')}>Cancel my registration</button>
              )}

              {event.isVolunteerNeeded && (
                <>
                  <button className={`w-full ${v.done ? 'btn-success' : 'btn-outline'}`} disabled={v.disabled || notLive} title={v.reason} onClick={() => start('volunteer')}>
                    {v.label}
                  </button>
                  {v.reason && !v.done && <p className="text-center text-xs text-red-600">{v.reason}</p>}
                  {event.myVolunteer === 'pending' && (
                    <button className="btn-ghost w-full" onClick={() => setConfirm('withdraw')}>Withdraw volunteer application</button>
                  )}
                </>
              )}
            </div>
          </div>
        </aside>
      </div>

      {modal && <RegistrationModal event={event} type={modal} onClose={() => setModal(null)} onDone={load} />}
      {confirm && (
        <ConfirmModal
          danger busy={busy} onClose={() => setConfirm(null)} onConfirm={undo}
          title={confirm === 'cancel' ? 'Cancel registration?' : 'Withdraw application?'}
          confirmLabel={confirm === 'cancel' ? 'Yes, cancel' : 'Yes, withdraw'}
          message={confirm === 'cancel' ? 'Your seat will be released for other students.' : 'Your volunteer application will be withdrawn.'}
        />
      )}
    </div>
  );
}
