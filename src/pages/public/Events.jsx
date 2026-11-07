import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarX, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg, unwrap } from '../../api/axios';
import EventCard from '../../components/EventCard';
import EmptyState from '../../components/EmptyState';
import SearchFilterBar from '../../components/SearchFilterBar';
import { CardSkeletons } from '../../components/Spinner';
import { useAuth } from '../../context/AuthContext';

const KEYS = ['q', 'club', 'category', 'from', 'to', 'open', 'page'];

// Filters live in the URL (?q=...&club=...) so results can be shared and survive reloads.
export default function Events() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [clubs, setClubs] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const filters = Object.fromEntries(KEYS.map((k) => [k, params.get(k) || '']));
  const page = Number(filters.page) || 1;
  const queryString = params.toString();

  const update = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in patch)) next.delete('page'); // any filter change goes back to page 1
    setParams(next, { replace: true });
  };

  useEffect(() => { api.get('/clubs').then((r) => setClubs(unwrap(r))).catch(() => {}); }, []);

  const load = useCallback(async () => {
    try {
      const query = Object.fromEntries(new URLSearchParams(queryString));
      setData(unwrap(await api.get('/events', { params: { ...query, limit: 9 } })));
    } catch (err) {
      toast.error(errMsg(err));
      setData({ events: [], total: 0, pages: 1 });
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  useEffect(() => { setLoading(true); load(); }, [load, user?._id]);

  const hasFilters = KEYS.slice(0, 6).some((k) => filters[k]);

  return (
    <>
      <div className="bg-gradient-to-r from-navy to-royal py-8 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <h1 className="text-3xl font-extrabold">Events</h1>
          <p className="mt-1 text-blue-100">Find something to attend, perform in or help organise.</p>
        </div>
      </div>
      <SearchFilterBar filters={filters} onChange={update} clubs={clubs} onReset={() => setParams({}, { replace: true })} />

      <div className="mx-auto max-w-7xl px-4 py-6">
        {loading ? <CardSkeletons /> : (
          <>
            <p className="mb-4 text-sm text-muted" aria-live="polite">
              {data.total} event{data.total === 1 ? '' : 's'} found{filters.from || filters.to ? '' : ' (upcoming)'}
            </p>
            {data.events.length === 0 ? (
              <EmptyState
                icon={CalendarX} title="No events match your search"
                text={hasFilters ? 'Try removing a filter or searching for something else.' : 'There are no upcoming events right now. Please check back soon.'}
                action={hasFilters && <button className="btn-primary" onClick={() => setParams({}, { replace: true })}>Clear filters</button>}
              />
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {data.events.map((e) => <EventCard key={e._id} event={e} onChanged={load} />)}
              </div>
            )}
            {data.pages > 1 && (
              <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Pagination">
                <button className="btn-outline" disabled={page <= 1} onClick={() => update({ page: String(page - 1) })}><ChevronLeft className="h-4 w-4" /> Prev</button>
                <span className="text-sm text-muted">Page {data.page} of {data.pages}</span>
                <button className="btn-outline" disabled={page >= data.pages} onClick={() => update({ page: String(page + 1) })}>Next <ChevronRight className="h-4 w-4" /></button>
              </nav>
            )}
          </>
        )}
      </div>
    </>
  );
}
