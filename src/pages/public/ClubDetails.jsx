import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Instagram, Linkedin, Mail, Users } from 'lucide-react';
import api, { errMsg, unwrap } from '../../api/axios';
import EventCard from '../../components/EventCard';
import EmptyState from '../../components/EmptyState';
import PosterImage from '../../components/PosterImage';
import Spinner from '../../components/Spinner';
import { useAuth } from '../../context/AuthContext';
import { assetUrl, gradientFor } from '../../utils/constants';
import { isPast } from '../../utils/formatDate';

export default function ClubDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [club, setClub] = useState(null);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('upcoming');

  const load = useCallback(async () => {
    try {
      const c = unwrap(await api.get(`/clubs/${id}`));
      setClub(c);
      // go through /events so each card knows the viewer's registration state
      const [up, past] = await Promise.all([
        api.get('/events', { params: { club: c._id, limit: 50 } }),
        api.get('/events', { params: { club: c._id, limit: 50, scope: 'past' } }),
      ]);
      setEvents([...unwrap(up).events, ...unwrap(past).events]);
    } catch (err) {
      setError(err.response?.status === 404 ? 'This club does not exist or is no longer active.' : errMsg(err));
    }
  }, [id]);

  useEffect(() => { load(); }, [load, user?._id]);

  if (error) return <div className="mx-auto max-w-3xl px-4 py-16"><EmptyState title="Club not found" text={error} action={<Link to="/clubs" className="btn-primary">All clubs</Link>} /></div>;
  if (!club) return <Spinner className="min-h-[60vh]" />;

  const shown = events.filter((e) => (tab === 'upcoming' ? !isPast(e.date) : isPast(e.date)));

  return (
    <>
      <div className="relative">
        <PosterImage src={club.banner} title={club.name} icon={Users} className="h-44 w-full sm:h-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />
      </div>
      <div className="mx-auto max-w-7xl px-4">
        <div className="card relative -mt-12 flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:gap-6 sm:p-6">
          <div className="-mt-14 h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-lg sm:-mt-16">
            {club.logo ? <img src={assetUrl(club.logo)} alt={`${club.name} logo`} className="h-full w-full object-cover" /> : (
              <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradientFor(club.name)} text-4xl font-bold text-white`}>{club.name[0]}</div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <Link to="/clubs" className="mb-1 inline-flex items-center gap-1 text-xs font-medium text-royal"><ArrowLeft className="h-3 w-3" /> All clubs</Link>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold sm:text-3xl">{club.name}</h1>
              <span className="chip">{club.category}</span>
              {!club.isActive && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold">Inactive</span>}
            </div>
            <p className="mt-2 text-slate-700">{club.description}</p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              {club.contactEmail && <a href={`mailto:${club.contactEmail}`} className="btn-outline btn-sm"><Mail className="h-4 w-4" /> {club.contactEmail}</a>}
              {club.socialLinks?.instagram && <a href={club.socialLinks.instagram} target="_blank" rel="noreferrer" className="btn-outline btn-sm"><Instagram className="h-4 w-4" /> Instagram</a>}
              {club.socialLinks?.linkedin && <a href={club.socialLinks.linkedin} target="_blank" rel="noreferrer" className="btn-outline btn-sm"><Linkedin className="h-4 w-4" /> LinkedIn</a>}
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-2 border-b border-slate-200" role="tablist">
          {['upcoming', 'past'].map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
              className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold capitalize ${tab === t ? 'border-royal text-royal' : 'border-transparent text-muted hover:text-ink'}`}>
              {t} events ({events.filter((e) => (t === 'upcoming' ? !isPast(e.date) : isPast(e.date))).length})
            </button>
          ))}
        </div>
        <div className="py-6">
          {shown.length === 0 ? (
            <EmptyState title={`No ${tab} events`} text={tab === 'upcoming' ? 'This club has nothing scheduled right now.' : 'No past events to show.'} />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((e) => <EventCard key={e._id} event={e} onChanged={load} />)}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
