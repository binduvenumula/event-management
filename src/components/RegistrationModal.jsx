import { useState } from 'react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { VOLUNTEER_ROLES } from '../utils/constants';
import { formatEventWhen } from '../utils/formatDate';
import Modal from './Modal';

// Defined outside the modal so inputs keep focus while typing.
function Field({ name, label, children, hint, errors }) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      {children}
      {hint && !errors[name] && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      {errors[name] && <p className="field-error">{errors[name]}</p>}
    </div>
  );
}

// One component, two separate forms: type="participation" or type="volunteer".
export default function RegistrationModal({ event, type, onClose, onDone }) {
  const { user } = useAuth();
  const isVol = type === 'volunteer';
  const [form, setForm] = useState(
    isVol
      ? { preferredRole: '', availability: '', experience: '', whyVolunteer: '' }
      : { teamName: '', phone: user?.phone || '', additionalInfo: '' }
  );
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => {
    setForm({ ...form, [k]: e.target.value });
    setErrors({ ...errors, [k]: undefined });
  };

  const validate = () => {
    const e = {};
    if (isVol) {
      if (!form.preferredRole) e.preferredRole = 'Choose a preferred role';
      if (!form.availability.trim()) e.availability = 'Tell us when you are available';
      if (!form.whyVolunteer.trim()) e.whyVolunteer = 'Please tell us why you want to volunteer';
    } else if (!/^[0-9+\-\s]{10,15}$/.test(form.phone)) {
      e.phone = 'Enter a valid phone number (10-15 digits)';
    }
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      const res = await api.post(`/events/${event._id}/${isVol ? 'volunteer' : 'participate'}`, form);
      toast.success(res.data.message);
      onDone?.();
      onClose();
    } catch (err) {
      toast.error(errMsg(err));
      onDone?.(); // refresh - e.g. the event may have just filled up
      if (err.response?.status === 409 || err.response?.status === 400) onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title={isVol ? 'Volunteer application' : 'Register as participant'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-outline" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" form="reg-form" className="btn-primary" disabled={busy}>
            {busy ? 'Submitting...' : isVol ? 'Submit application' : 'Confirm registration'}
          </button>
        </>
      }
    >
      <div className="mb-4 rounded-lg bg-sky p-3 text-sm">
        <p className="font-semibold text-navy">{event.title}</p>
        <p className="text-muted">{formatEventWhen(event)} · {event.venue}</p>
      </div>
      <form id="reg-form" onSubmit={submit} className="space-y-4" noValidate>
        {isVol ? (
          <>
            <Field errors={errors} name="preferredRole" label="Preferred role *">
              <select id="preferredRole" className={`input ${errors.preferredRole ? 'input-error' : ''}`} value={form.preferredRole} onChange={set('preferredRole')}>
                <option value="">Select a role</option>
                {VOLUNTEER_ROLES.map((r) => <option key={r}>{r}</option>)}
              </select>
            </Field>
            <Field errors={errors} name="availability" label="Availability *" hint="e.g. Full day on the event date, evenings before it">
              <input id="availability" className={`input ${errors.availability ? 'input-error' : ''}`} value={form.availability} onChange={set('availability')} maxLength={200} />
            </Field>
            <Field errors={errors} name="experience" label="Relevant experience (optional)">
              <textarea id="experience" rows={2} className="input" value={form.experience} onChange={set('experience')} maxLength={500} />
            </Field>
            <Field errors={errors} name="whyVolunteer" label="Why do you want to volunteer? *">
              <textarea id="whyVolunteer" rows={3} className={`input ${errors.whyVolunteer ? 'input-error' : ''}`} value={form.whyVolunteer} onChange={set('whyVolunteer')} maxLength={500} />
            </Field>
          </>
        ) : (
          <>
            <Field errors={errors} name="teamName" label="Team name (optional)">
              <input id="teamName" className="input" value={form.teamName} onChange={set('teamName')} maxLength={80} />
            </Field>
            <Field errors={errors} name="phone" label="Phone number *">
              <input id="phone" type="tel" className={`input ${errors.phone ? 'input-error' : ''}`} value={form.phone} onChange={set('phone')} />
            </Field>
            <Field errors={errors} name="additionalInfo" label="Additional information (optional)">
              <textarea id="additionalInfo" rows={3} className="input" value={form.additionalInfo} onChange={set('additionalInfo')} maxLength={500} placeholder="Dietary needs, special requirements, team members..." />
            </Field>
          </>
        )}
      </form>
    </Modal>
  );
}
