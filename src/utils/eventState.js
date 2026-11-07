// Works out what the Register / Volunteer buttons should say and whether they are usable.
// `event` comes from the API (with participantCount, registrationClosed, myParticipation, myVolunteer).

export const seatsLeft = (e) => Math.max(e.participantCapacity - (e.participantCount || 0), 0);

// Badge shown on cards: { text, tone }
export function seatBadge(e) {
  if (e.registrationClosed) return { text: 'Closed', tone: 'bg-slate-200 text-slate-700' };
  const left = seatsLeft(e);
  if (left === 0) return { text: 'Full', tone: 'bg-red-100 text-red-700' };
  if (left <= 10) return { text: `${left} seat${left > 1 ? 's' : ''} left`, tone: 'bg-amber-100 text-amber-800' };
  return { text: `${left} seats left`, tone: 'bg-emerald-100 text-emerald-700' };
}

export function participationState(e, user) {
  if (user && user.role !== 'student') return { label: 'Register', disabled: true, reason: 'Only students can register' };
  if (e.myParticipation === 'registered') return { label: 'Registered ✓', disabled: true, done: true };
  if (e.registrationClosed) return { label: 'Closed', disabled: true, reason: e.registrationClosedReason };
  if (seatsLeft(e) === 0) return { label: 'Full', disabled: true, reason: 'No seats are left' };
  return { label: 'Register', disabled: false };
}

export function volunteerState(e, user) {
  if (user && user.role !== 'student') return { label: 'Volunteer', disabled: true, reason: 'Only students can volunteer' };
  const s = e.myVolunteer;
  if (s === 'pending') return { label: 'Applied (Pending)', disabled: true, done: true };
  if (s === 'approved') return { label: 'Volunteer ✓ Approved', disabled: true, done: true };
  if (s === 'rejected') return { label: 'Application rejected', disabled: true, reason: 'Your application was rejected' };
  if (e.registrationClosed) return { label: 'Closed', disabled: true, reason: e.registrationClosedReason };
  return { label: 'Volunteer', disabled: false };
}
