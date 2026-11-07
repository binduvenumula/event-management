import { useState } from 'react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../api/axios';
import { formatDate, formatDateTime, formatTime } from '../utils/formatDate';
import Modal from './Modal';
import PosterImage from './PosterImage';
import StatusBadge from './StatusBadge';

// President reviews an event: full details + Approve / Reject (reason required).
export default function EventReviewModal({ event, onClose, onDone }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState('');
  const pending = event.status === 'pending';

  const approve = async () => {
    setBusy('approve');
    try {
      const res = await api.patch(`/events/${event._id}/approve`);
      toast.success(res.data.message);
      onDone();
      onClose();
    } catch (err) { toast.error(errMsg(err)); onDone(); } finally { setBusy(''); }
  };

  const reject = async () => {
    if (!reason.trim()) return toast.error('Please enter a rejection reason');
    setBusy('reject');
    try {
      const res = await api.patch(`/events/${event._id}/reject`, { reason: reason.trim() });
      toast.success(res.data.message);
      onDone();
      onClose();
    } catch (err) { toast.error(errMsg(err)); onDone(); } finally { setBusy(''); }
  };

  const rows = [
    ['Club', event.club?.name], ['Category', event.category], ['Date', formatDate(event.date)],
    ['Time', `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`], ['Venue', event.venue],
    ['Registration deadline', formatDateTime(event.registrationDeadline)], ['Participant capacity', event.participantCapacity],
    ['Volunteers', event.isVolunteerNeeded ? `${event.volunteerCapacity} needed` : 'Not needed'],
    ['Tags', event.tags?.join(', ') || '-'],
  ];

  return (
    <Modal
      title="Review event" size="lg" onClose={onClose}
      footer={pending ? (
        rejecting ? (
          <>
            <button className="btn-outline" onClick={() => setRejecting(false)} disabled={!!busy}>Back</button>
            <button className="btn-danger" onClick={reject} disabled={!!busy}>{busy === 'reject' ? 'Rejecting...' : 'Confirm rejection'}</button>
          </>
        ) : (
          <>
            <button className="btn-outline" onClick={onClose}>Close</button>
            <button className="btn-danger" onClick={() => setRejecting(true)}>Reject</button>
            <button className="btn-success" onClick={approve} disabled={!!busy}>{busy === 'approve' ? 'Approving...' : 'Approve'}</button>
          </>
        )
      ) : <button className="btn-outline" onClick={onClose}>Close</button>}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <PosterImage src={event.poster} title={event.title} className="aspect-video w-full rounded-lg md:col-span-2" />
        <div className="md:col-span-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-bold">{event.title}</h3>
            <StatusBadge status={event.status} />
          </div>
          <p className="mt-1 line-clamp-6 whitespace-pre-line text-sm text-slate-700">{event.description}</p>
        </div>
      </div>
      <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3 border-b border-slate-100 py-1.5"><dt className="text-muted">{k}</dt><dd className="text-right font-medium">{v}</dd></div>
        ))}
      </dl>
      {event.status === 'rejected' && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800"><b>Rejection reason:</b> {event.rejectionReason}</p>}
      {rejecting && (
        <div className="mt-4">
          <label className="label" htmlFor="reason">Reason for rejection *</label>
          <textarea id="reason" rows={3} maxLength={500} autoFocus className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Tell the club what to fix before resubmitting" />
        </div>
      )}
    </Modal>
  );
}
