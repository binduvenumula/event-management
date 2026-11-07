import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { errMsg, unwrap } from '../../api/axios';
import EventForm from '../../components/EventForm';
import { ConfirmModal } from '../../components/Modal';
import Spinner from '../../components/Spinner';
import StatusBadge from '../../components/StatusBadge';

export default function CreateEditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [initial, setInitial] = useState(null);
  const [loading, setLoading] = useState(!!id);
  const [busy, setBusy] = useState(false);
  const [pendingSave, setPendingSave] = useState(null); // form data waiting for re-approval confirmation

  useEffect(() => {
    if (!id) return;
    api.get(`/events/${id}`).then((r) => setInitial(unwrap(r))).catch((e) => { toast.error(errMsg(e)); navigate('/club/events'); }).finally(() => setLoading(false));
  }, [id, navigate]);

  const save = async (fd) => {
    setBusy(true);
    try {
      const res = id ? await api.put(`/events/${id}`, fd) : await api.post('/events', fd);
      toast.success(res.data.message);
      navigate('/club/events');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
      setPendingSave(null);
    }
  };

  // Editing an approved event sends it back to "pending" - ask first.
  const onSubmit = (fd) => (initial?.status === 'approved' ? setPendingSave(fd) : save(fd));

  if (loading) return <Spinner />;
  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold">{id ? 'Edit event' : 'Create event'}</h1>
        {initial && <StatusBadge status={initial.status} />}
      </div>
      {initial?.status === 'rejected' && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"><b>Rejected by the President:</b> {initial.rejectionReason}<br />Fix the issues below and resubmit.</div>
      )}
      {initial?.status === 'approved' && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">This event is live. Saving changes will send it back to <b>pending</b> and hide it from students until re-approved.</div>
      )}
      <EventForm initial={initial} busy={busy} onSubmit={onSubmit} />

      {pendingSave && (
        <ConfirmModal
          busy={busy} onClose={() => setPendingSave(null)} onConfirm={() => save(pendingSave)}
          title="Send event back for approval?" confirmLabel="Save & resubmit"
          message="This event is currently live. After saving, it will be marked pending and will disappear from the public feed until the President approves it again."
        />
      )}
    </div>
  );
}
