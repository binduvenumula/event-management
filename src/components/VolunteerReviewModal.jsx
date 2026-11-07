import { useState } from 'react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../api/axios';
import Modal from './Modal';
import StatusBadge from './StatusBadge';

// Club head reviews one volunteer application: approve / reject with an optional note.
export default function VolunteerReviewModal({ reg, onClose, onDone }) {
  const [note, setNote] = useState(reg.reviewNote || '');
  const [busy, setBusy] = useState('');

  const review = async (status) => {
    setBusy(status);
    try {
      const res = await api.patch(`/registrations/${reg._id}/review`, { status, reviewNote: note });
      toast.success(res.data.message);
      onDone();
      onClose();
    } catch (err) {
      toast.error(errMsg(err));
      onDone();
    } finally {
      setBusy('');
    }
  };

  const s = reg.student || {};
  const rows = [
    ['Student', `${s.name} (${s.rollNumber || '-'})`], ['Email', s.email], ['Branch / Year', `${s.branch || '-'} / ${s.year || '-'}`],
    ['Preferred role', reg.preferredRole], ['Availability', reg.availability], ['Experience', reg.experience || '-'], ['Why volunteer', reg.whyVolunteer],
  ];

  return (
    <Modal
      title="Review volunteer application" onClose={onClose}
      footer={
        <>
          <button className="btn-outline" onClick={onClose} disabled={!!busy}>Close</button>
          <button className="btn-danger" onClick={() => review('rejected')} disabled={!!busy || reg.status === 'rejected'}>{busy === 'rejected' ? 'Rejecting...' : 'Reject'}</button>
          <button className="btn-success" onClick={() => review('approved')} disabled={!!busy || reg.status === 'approved'}>{busy === 'approved' ? 'Approving...' : 'Approve'}</button>
        </>
      }
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="font-semibold">{reg.event?.title}</p>
        <StatusBadge status={reg.status} />
      </div>
      <dl className="space-y-2 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-3 gap-2"><dt className="text-muted">{k}</dt><dd className="col-span-2 break-words font-medium">{v}</dd></div>
        ))}
      </dl>
      <label className="label mt-4" htmlFor="note">Note to student (optional)</label>
      <textarea id="note" rows={2} className="input" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Please report at 8 AM at the registration desk." />
    </Modal>
  );
}
