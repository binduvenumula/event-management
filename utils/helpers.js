const Notification = require('../models/Notification');

// Error with an HTTP status; the global error handler turns it into { success:false, message }.
class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Wrap async route handlers so rejected promises reach the error middleware.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Consistent success response: { success, message, data }
const ok = (res, data = null, message = 'OK', status = 200) =>
  res.status(status).json({ success: true, message, data });

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const slugify = (s) =>
  String(s).toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Compare ids whether they are ObjectIds, strings or populated documents.
const sameId = (a, b) => !!a && !!b && String(a._id || a) === String(b._id || b);

// "2026-12-12" for a stored Date
const dateOnly = (d) => new Date(d).toISOString().slice(0, 10);

// Event start / end as real Date objects (server local time).
const eventStart = (ev) => new Date(`${dateOnly(ev.date)}T${ev.startTime}:00`);
const eventEnd = (ev) => new Date(`${dateOnly(ev.date)}T${ev.endTime}:00`);

// Returns a reason string when registration is closed, otherwise null.
function closedReason(ev) {
  const now = new Date();
  if (now > eventEnd(ev)) return 'This event has already taken place';
  if (now > new Date(ev.registrationDeadline)) return 'Registration deadline has passed';
  return null;
}

// Create one notification per user id.
async function notify(userIds, { title, message = '', link = '', type = 'info' }) {
  const ids = [...new Set(userIds.map(String))];
  if (!ids.length) return;
  await Notification.insertMany(ids.map((user) => ({ user, title, message, link, type })));
}

module.exports = { ApiError, asyncHandler, ok, escapeRegex, slugify, sameId, dateOnly, eventStart, eventEnd, closedReason, notify };
