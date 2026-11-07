import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CalendarDays, Clock, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { formatDate, formatTime } from '../utils/formatDate';
import { participationState, seatBadge, volunteerState } from '../utils/eventState';
import PosterImage from './PosterImage';
import RegistrationModal from './RegistrationModal';

// Card used in the events feed, home page and club pages.
export default function EventCard({ event, onChanged }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [modal, setModal] = useState(null); // 'participation' | 'volunteer'

  const p = participationState(event, user);
  const v = volunteerState(event, user);
  const badge = seatBadge(event);

  const start = (type) => {
    if (!user) {
      toast('Please log in to continue');
      navigate('/login', { state: { from: location.pathname + location.search } });
      return;
    }
    setModal(type);
  };

  const btn = (state, type, primary) => (
    <button
      className={`${state.done ? 'btn-success' : primary ? 'btn-primary' : 'btn-outline'} flex-1`}
      disabled={state.disabled}
      title={state.reason || ''}
      onClick={() => start(type)}
    >
      {state.label}
    </button>
  );

  return (
    <article className="card card-hover flex flex-col overflow-hidden">
      <Link to={`/events/${event._id}`} className="relative block">
        <PosterImage src={event.poster} title={event.title} className="aspect-video w-full" />
        <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold shadow ${badge.tone}`}>{badge.text}</span>
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="chip">{event.category}</span>
          {event.club && <Link to={`/clubs/${event.club.slug || event.club._id}`} className="truncate text-xs font-medium text-muted hover:text-royal">{event.club.name}</Link>}
        </div>
        <Link to={`/events/${event._id}`}><h3 className="line-clamp-2 text-lg font-bold leading-snug text-ink hover:text-royal">{event.title}</h3></Link>
        <ul className="mt-3 space-y-1.5 text-sm text-muted">
          <li className="flex items-center gap-2"><CalendarDays className="h-4 w-4 shrink-0 text-royal" /> {formatDate(event.date)}</li>
          <li className="flex items-center gap-2"><Clock className="h-4 w-4 shrink-0 text-royal" /> {formatTime(event.startTime)} - {formatTime(event.endTime)}</li>
          <li className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0 text-royal" /> <span className="truncate">{event.venue}</span></li>
        </ul>
        <div className="mt-auto flex gap-2 pt-4">
          {btn(p, 'participation', true)}
          {event.isVolunteerNeeded && btn(v, 'volunteer', false)}
        </div>
      </div>
      {modal && <RegistrationModal event={event} type={modal} onClose={() => setModal(null)} onDone={onChanged} />}
    </article>
  );
}
