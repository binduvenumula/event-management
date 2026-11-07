import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarDays, Search, Sparkles, Users, UserPlus, Ticket, Heart } from 'lucide-react';
import api, { unwrap } from '../../api/axios';
import EventCard from '../../components/EventCard';
import ClubCard from '../../components/ClubCard';
import EmptyState from '../../components/EmptyState';
import { CardSkeletons } from '../../components/Spinner';
import { useAuth } from '../../context/AuthContext';

const steps = [
  { icon: UserPlus, title: 'Create your account', text: 'Sign up with your college details in under a minute.' },
  { icon: Search, title: 'Discover events', text: 'Search and filter events by club, category and date.' },
  { icon: Ticket, title: 'Register or volunteer', text: 'Grab a seat as a participant, or lend a hand as a volunteer.' },
];

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [events, setEvents] = useState(null);
  const [clubs, setClubs] = useState(null);
  const [stats, setStats] = useState({ clubs: 0, upcomingEvents: 0, students: 0 });

  const loadEvents = () =>
    api.get('/events', { params: { limit: 6 } }).then((r) => {
      const d = unwrap(r);
      setEvents(d.events);
    }).catch(() => setEvents([]));

  useEffect(() => {
    loadEvents();
    api.get('/clubs').then((r) => setClubs(unwrap(r))).catch(() => setClubs([]));
    api.get('/stats/public').then((r) => setStats(unwrap(r))).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  const search = (e) => {
    e.preventDefault();
    navigate(q.trim() ? `/events?q=${encodeURIComponent(q.trim())}` : '/events');
  };

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy via-royal to-blue-500 text-white">
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-24 left-10 h-72 w-72 rounded-full bg-sky/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 text-center sm:py-24">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> Campus events portal
          </span>
          <h1 className="mx-auto max-w-4xl text-3xl font-extrabold leading-tight sm:text-5xl">
            Vignan's Foundation for Science, Technology &amp; Research
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-blue-100 sm:text-lg">
            Discover hackathons, workshops, fests and drives. Register, volunteer and stay connected with every club on campus.
          </p>
          <form onSubmit={search} className="mx-auto mt-8 flex max-w-xl flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search events"
                placeholder="Search hackathon, workshop, cricket..."
                className="w-full rounded-lg border-0 py-3 pl-10 pr-3 text-sm text-ink shadow-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <button className="btn-accent px-6 py-3">Search</button>
          </form>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/events" className="btn bg-white text-navy hover:bg-sky">Explore Events <ArrowRight className="h-4 w-4" /></Link>
            <Link to="/clubs" className="btn border border-white/60 text-white hover:bg-white/10">Join a Club</Link>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="mx-auto -mt-8 max-w-5xl px-4">
        <div className="card grid grid-cols-3 divide-x divide-slate-100 text-center">
          {[
            { icon: Users, n: stats.clubs, label: 'Active clubs' },
            { icon: CalendarDays, n: stats.upcomingEvents, label: 'Upcoming events' },
            { icon: Heart, n: stats.students, label: 'Students registered' },
          ].map(({ icon: Icon, n, label }) => (
            <div key={label} className="px-2 py-5">
              <Icon className="mx-auto mb-1 h-5 w-5 text-royal" />
              <p className="text-2xl font-extrabold text-navy sm:text-3xl">{n}</p>
              <p className="text-xs text-muted sm:text-sm">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Upcoming events */}
      <section className="mx-auto max-w-7xl px-4 pt-14">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold">Upcoming events</h2>
            <p className="text-sm text-muted">The next events open for registration</p>
          </div>
          <Link to="/events" className="hidden items-center gap-1 text-sm font-semibold text-royal sm:flex">View all <ArrowRight className="h-4 w-4" /></Link>
        </div>
        {events === null ? <CardSkeletons /> : events.length === 0 ? (
          <EmptyState icon={CalendarDays} title="No upcoming events" text="Check back soon - clubs are planning new events." />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e) => <EventCard key={e._id} event={e} onChanged={loadEvents} />)}
          </div>
        )}
      </section>

      {/* Featured clubs */}
      <section className="mx-auto max-w-7xl px-4 pt-14">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold">Featured clubs</h2>
            <p className="text-sm text-muted">Find your people and your passion</p>
          </div>
          <Link to="/clubs" className="hidden items-center gap-1 text-sm font-semibold text-royal sm:flex">All clubs <ArrowRight className="h-4 w-4" /></Link>
        </div>
        {clubs === null ? <CardSkeletons count={3} /> : clubs.length === 0 ? (
          <EmptyState icon={Users} title="No clubs yet" />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {clubs.slice(0, 6).map((c) => <ClubCard key={c._id} club={c} />)}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 pt-16">
        <h2 className="mb-8 text-center text-2xl font-bold">How it works</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <div key={title} className="card relative p-6 text-center">
              <span className="absolute -top-3 left-1/2 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">{i + 1}</span>
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-sky text-royal"><Icon className="h-6 w-6" /></div>
              <h3 className="font-bold">{title}</h3>
              <p className="mt-1 text-sm text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pt-16">
        <div className="rounded-2xl bg-gradient-to-r from-navy to-royal px-6 py-10 text-center text-white sm:py-14">
          <h2 className="text-2xl font-extrabold sm:text-3xl">Ready to make the most of campus life?</h2>
          <p className="mx-auto mt-2 max-w-xl text-blue-100">Join VFSTR's event community today - it takes less than a minute.</p>
          <Link to={user ? '/events' : '/signup'} className="btn-accent mt-6 px-6 py-3">{user ? 'Browse events' : 'Create your account'}</Link>
        </div>
      </section>
    </>
  );
}
