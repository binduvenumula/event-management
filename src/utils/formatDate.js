// Event dates are stored as UTC midnight, so they are formatted in UTC to avoid day shifts.
const fmt = (opts, tz) => new Intl.DateTimeFormat('en-GB', { ...opts, ...(tz ? { timeZone: tz } : {}) });

export const formatDate = (d) => (d ? fmt({ day: '2-digit', month: 'short', year: 'numeric' }, 'UTC').format(new Date(d)) : '-');

// "10:00" -> "10:00 AM"
export function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

// Event day + start time: "12 Dec 2026, 10:00 AM"
export const formatEventWhen = (e) => `${formatDate(e.date)}, ${formatTime(e.startTime)}`;

// Real timestamps (createdAt, deadline) are shown in the viewer's local time: "12 Dec 2026, 10:00 AM"
export function formatDateTime(d) {
  if (!d) return '-';
  const dt = new Date(d);
  const date = fmt({ day: '2-digit', month: 'short', year: 'numeric' }).format(dt);
  const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(dt);
  return `${date}, ${time}`;
}

// "5 days left", "3 hours left", "Closed"
export function timeLeft(deadline) {
  const ms = new Date(deadline) - Date.now();
  if (ms <= 0) return 'Closed';
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${Math.max(mins, 1)} min left`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `${hrs} hour${hrs > 1 ? 's' : ''} left`;
  return `${Math.floor(hrs / 24)} days left`;
}

// For <input type="date"> (UTC date part) and <input type="datetime-local"> (local time)
export const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');
export function toDateTimeInput(d) {
  if (!d) return '';
  const dt = new Date(d);
  const pad = (n) => String(n).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}

// An event is "past" once its day is before today (UTC date compare).
export const isPast = (d) => new Date(d) < new Date(new Date().toISOString().slice(0, 10));
