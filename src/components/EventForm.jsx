import { useEffect, useMemo, useState } from 'react';
import { ImagePlus, Save, Send } from 'lucide-react';
import { EVENT_CATEGORIES } from '../utils/constants';
import { toDateInput, toDateTimeInput } from '../utils/formatDate';
import PosterImage from './PosterImage';

const blank = {
  title: '', description: '', category: 'Technical', date: '', startTime: '10:00', endTime: '12:00', venue: '',
  registrationDeadline: '', participantCapacity: 50, isVolunteerNeeded: false, volunteerCapacity: 0, tags: '', posterUrl: '',
};

// Create / edit form for club heads.
// onSubmit(formData, submitForApproval) - formData is multipart so a poster file can be included.
export default function EventForm({ initial, busy, onSubmit }) {
  const [f, setF] = useState(blank);
  const [file, setFile] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!initial) return;
    setF({
      title: initial.title, description: initial.description, category: initial.category,
      date: toDateInput(initial.date), startTime: initial.startTime, endTime: initial.endTime, venue: initial.venue,
      registrationDeadline: toDateTimeInput(initial.registrationDeadline),
      participantCapacity: initial.participantCapacity, isVolunteerNeeded: initial.isVolunteerNeeded,
      volunteerCapacity: initial.volunteerCapacity, tags: (initial.tags || []).join(', '), posterUrl: initial.poster?.startsWith('http') ? initial.poster : '',
    });
  }, [initial]);

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setF((prev) => ({ ...prev, [k]: v }));
    setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  // preview for a chosen file / URL / existing poster
  const preview = useMemo(() => {
    if (file) return URL.createObjectURL(file);
    return f.posterUrl || initial?.poster || '';
  }, [file, f.posterUrl, initial]);

  const pickFile = (e) => {
    const picked = e.target.files[0];
    if (!picked) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(picked.type)) return setErrors((p) => ({ ...p, poster: 'Only jpg, png or webp images are allowed' }));
    if (picked.size > 2 * 1024 * 1024) return setErrors((p) => ({ ...p, poster: 'Image must be 2 MB or smaller' }));
    setErrors((p) => ({ ...p, poster: undefined }));
    setFile(picked);
  };

  const validate = () => {
    const e = {};
    if (!f.title.trim()) e.title = 'Title is required';
    if (!f.description.trim()) e.description = 'Description is required';
    if (!f.venue.trim()) e.venue = 'Venue is required';
    if (!f.date) e.date = 'Event date is required';
    if (!f.registrationDeadline) e.registrationDeadline = 'Registration deadline is required';
    if (f.endTime <= f.startTime) e.endTime = 'End time must be after start time';
    if (f.date) {
      const start = new Date(`${f.date}T${f.startTime}`);
      const unchanged = initial && toDateInput(initial.date) === f.date && initial.startTime === f.startTime;
      if (!unchanged && start <= new Date()) e.date = 'Event date must be in the future';
      if (f.registrationDeadline && new Date(f.registrationDeadline) >= start) e.registrationDeadline = 'Deadline must be before the event starts';
    }
    if (!(Number(f.participantCapacity) >= 1)) e.participantCapacity = 'Capacity must be at least 1';
    if (f.isVolunteerNeeded && !(Number(f.volunteerCapacity) >= 1)) e.volunteerCapacity = 'Enter how many volunteers you need';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = (submitForApproval) => (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    const fd = new FormData();
    Object.entries(f).forEach(([k, v]) => {
      if (k === 'posterUrl') return;
      fd.append(k, k === 'volunteerCapacity' && !f.isVolunteerNeeded ? 0 : v);
    });
    // send the registration deadline as a real timestamp (browser local time -> ISO)
    fd.set('registrationDeadline', new Date(f.registrationDeadline).toISOString());
    if (file) fd.append('poster', file);
    else if (f.posterUrl || !initial?.poster?.startsWith('/uploads')) fd.append('posterUrl', f.posterUrl); // else keep the uploaded poster
    fd.append('submit', submitForApproval);
    onSubmit(fd, submitForApproval);
  };

  const field = (name, label, el, hint) => (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      {el}
      {hint && !errors[name] && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      {errors[name] && <p className="field-error">{errors[name]}</p>}
    </div>
  );
  const cls = (n) => `input ${errors[n] ? 'input-error' : ''}`;
  const isApproved = initial?.status === 'approved';

  return (
    <form className="space-y-6" noValidate onSubmit={submit(false)}>
      <section className="card space-y-4 p-5">
        <h2 className="font-bold text-ink">Basic details</h2>
        {field('title', 'Event title *', <input id="title" className={cls('title')} value={f.title} onChange={set('title')} maxLength={120} />)}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {field('category', 'Category *', (
            <select id="category" className="input" value={f.category} onChange={set('category')}>
              {EVENT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          ))}
          {field('tags', 'Tags', <input id="tags" className="input" value={f.tags} onChange={set('tags')} placeholder="hackathon, coding, teams" />, 'Comma separated, helps search')}
        </div>
        {field('description', 'Description *', <textarea id="description" rows={5} className={cls('description')} value={f.description} onChange={set('description')} maxLength={3000} />)}
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="font-bold text-ink">Date, time &amp; venue</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {field('date', 'Event date *', <input id="date" type="date" className={cls('date')} value={f.date} onChange={set('date')} />)}
          {field('startTime', 'Start time *', <input id="startTime" type="time" className="input" value={f.startTime} onChange={set('startTime')} />)}
          {field('endTime', 'End time *', <input id="endTime" type="time" className={cls('endTime')} value={f.endTime} onChange={set('endTime')} />)}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {field('venue', 'Venue *', <input id="venue" className={cls('venue')} value={f.venue} onChange={set('venue')} />)}
          {field('registrationDeadline', 'Registration deadline *', <input id="registrationDeadline" type="datetime-local" className={cls('registrationDeadline')} value={f.registrationDeadline} onChange={set('registrationDeadline')} />)}
        </div>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="font-bold text-ink">Capacity</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {field('participantCapacity', 'Participant capacity *', <input id="participantCapacity" type="number" min="1" className={cls('participantCapacity')} value={f.participantCapacity} onChange={set('participantCapacity')} />)}
          <div>
            <label className="label" htmlFor="isVolunteerNeeded">Volunteers</label>
            <label className="flex h-[38px] cursor-pointer items-center gap-2 text-sm">
              <input id="isVolunteerNeeded" type="checkbox" className="h-4 w-4 accent-royal" checked={f.isVolunteerNeeded} onChange={set('isVolunteerNeeded')} />
              This event needs volunteers
            </label>
          </div>
        </div>
        {f.isVolunteerNeeded && field('volunteerCapacity', 'Volunteers needed *', <input id="volunteerCapacity" type="number" min="1" className={cls('volunteerCapacity') + ' sm:max-w-xs'} value={f.volunteerCapacity} onChange={set('volunteerCapacity')} />)}
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="font-bold text-ink">Poster</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[220px_1fr]">
          <PosterImage src={preview} title={f.title || 'Poster'} className="aspect-video w-full rounded-lg" />
          <div className="space-y-3">
            {field('poster', 'Upload image (jpg, png, webp - max 2 MB)', (
              <label className="btn-outline cursor-pointer"><ImagePlus className="h-4 w-4" /> {file ? file.name : 'Choose image'}
                <input id="poster" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={pickFile} />
              </label>
            ))}
            {field('posterUrl', 'Or paste an image URL', <input id="posterUrl" className="input" placeholder="https://..." value={f.posterUrl} onChange={set('posterUrl')} disabled={!!file} />, 'Used when no file is uploaded. Leave blank for a gradient placeholder.')}
            {file && <button type="button" className="text-xs font-medium text-red-600" onClick={() => setFile(null)}>Remove uploaded file</button>}
          </div>
        </div>
      </section>

      <div className="flex flex-wrap justify-end gap-3">
        {isApproved ? (
          <button type="button" className="btn-primary" disabled={busy} onClick={submit(false)}><Save className="h-4 w-4" /> {busy ? 'Saving...' : 'Save changes (needs re-approval)'}</button>
        ) : (
          <>
            <button type="submit" className="btn-outline" disabled={busy}><Save className="h-4 w-4" /> Save as draft</button>
            <button type="button" className="btn-primary" disabled={busy} onClick={submit(true)}><Send className="h-4 w-4" /> {busy ? 'Saving...' : 'Save & submit for approval'}</button>
          </>
        )}
      </div>
    </form>
  );
}
