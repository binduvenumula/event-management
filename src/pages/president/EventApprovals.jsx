import { useCallback, useEffect, useState } from 'react';
import { CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg, unwrap } from '../../api/axios';
import EmptyState from '../../components/EmptyState';
import Spinner from '../../components/Spinner';
import PosterImage from '../../components/PosterImage';
import EventReviewModal from '../../components/EventReviewModal';
import { formatDate, formatDateTime, formatTime } from '../../utils/formatDate';

// Pending approvals queue.
export default function EventApprovals() {
  const [events, setEvents] = useState(null);
  const [review, setReview] = useState(null);

  const load = useCallback(() => api.get('/events/admin/all', { params: { status: 'pending' } })
    .then((r) => setEvents(unwrap(r))).catch((e) => { toast.error(errMsg(e)); setEvents([]); }), []);
  useEffect(() => { load(); }, [load]);

  if (!events) return <Spinner />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">Event approvals</h1>
        <p className="text-sm text-muted">{events.length} event{events.length === 1 ? '' : 's'} waiting for review</p>
      </div>
      {events.length === 0 ? (
        <EmptyState icon={CheckSquare} title="Nothing to review" text="When a club submits an event, it will appear here." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {events.map((e) => (
            <article key={e._id} className="card flex flex-col overflow-hidden sm:flex-row">
              <PosterImage src={e.poster} title={e.title} className="h-40 w-full sm:h-auto sm:w-40 sm:shrink-0" />
              <div className="flex min-w-0 flex-1 flex-col p-4">
                <div className="mb-1 flex flex-wrap items-center gap-2"><span className="chip">{e.category}</span><span className="text-xs text-muted">{e.club?.name}</span></div>
                <h2 className="font-bold leading-snug">{e.title}</h2>
                <p className="mt-1 text-xs text-muted">{formatDate(e.date)}, {formatTime(e.startTime)} · {e.venue}</p>
                <p className="text-xs text-muted">Submitted {formatDateTime(e.updatedAt)}</p>
                <button className="btn-primary mt-3 self-start" onClick={() => setReview(e)}>Review</button>
              </div>
            </article>
          ))}
        </div>
      )}
      {review && <EventReviewModal event={review} onClose={() => setReview(null)} onDone={load} />}
    </div>
  );
}
