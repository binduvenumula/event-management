const Event = require('../models/Event');
const Club = require('../models/Club');
const User = require('../models/User');
const Registration = require('../models/Registration');
const Announcement = require('../models/Announcement');
const { ApiError, asyncHandler, ok, escapeRegex, sameId, dateOnly, eventStart, closedReason, notify } = require('../utils/helpers');

const CLUB_FIELDS = 'name slug logo category isActive contactEmail';

/* ---------- helpers ---------- */

// Adds live counts, "registration closed" info and (for students) their own registration status.
async function decorate(events, user) {
  if (!events.length) return events;
  const ids = events.map((e) => e._id);
  const counts = await Registration.aggregate([
    {
      $match: {
        event: { $in: ids },
        $or: [
          { type: 'participation', status: 'registered' },
          { type: 'volunteer', status: { $in: ['approved', 'pending'] } },
        ],
      },
    },
    { $group: { _id: { event: '$event', type: '$type', status: '$status' }, n: { $sum: 1 } } },
  ]);
  const map = {};
  counts.forEach(({ _id, n }) => {
    const m = (map[_id.event] ||= { participants: 0, approvedVolunteers: 0, pendingVolunteers: 0 });
    if (_id.type === 'participation') m.participants = n;
    else if (_id.status === 'approved') m.approvedVolunteers = n;
    else m.pendingVolunteers = n;
  });

  let mine = {};
  if (user?.role === 'student') {
    const regs = await Registration.find({ student: user._id, event: { $in: ids } }).select('event type status').lean();
    regs.forEach((r) => {
      (mine[r.event] ||= {})[r.type === 'participation' ? 'myParticipation' : 'myVolunteer'] = r.status;
    });
  }

  events.forEach((e) => {
    const m = map[e._id] || {};
    e.participantCount = m.participants || 0;
    e.volunteerCount = m.approvedVolunteers || 0;
    e.pendingVolunteerCount = m.pendingVolunteers || 0;
    e.registrationClosedReason = closedReason(e);
    e.registrationClosed = !!e.registrationClosedReason;
    e.myParticipation = mine[e._id]?.myParticipation || null;
    e.myVolunteer = mine[e._id]?.myVolunteer || null;
  });
  return events;
}

const toBool = (v) => v === true || v === 'true' || v === 'on' || v === '1';

// Turns the (possibly multipart/string) request body into a clean event payload.
function buildPayload(req, existing) {
  const b = req.body;
  const isVolunteerNeeded = toBool(b.isVolunteerNeeded);
  const volunteerCapacity = isVolunteerNeeded ? Number(b.volunteerCapacity || 0) : 0;
  if (isVolunteerNeeded && volunteerCapacity < 1) throw new ApiError(400, 'Volunteer capacity must be at least 1 when volunteers are needed');

  const tags = Array.isArray(b.tags) ? b.tags : String(b.tags || '').split(',');
  const payload = {
    title: b.title,
    description: b.description,
    category: b.category,
    date: new Date(String(b.date).slice(0, 10)),
    startTime: b.startTime,
    endTime: b.endTime,
    venue: b.venue,
    registrationDeadline: new Date(b.registrationDeadline),
    participantCapacity: Number(b.participantCapacity),
    isVolunteerNeeded,
    volunteerCapacity,
    tags: tags.map((t) => t.trim()).filter(Boolean).slice(0, 8),
  };
  if (req.file) payload.poster = `/uploads/${req.file.filename}`;
  else if (b.posterUrl !== undefined) payload.poster = b.posterUrl;
  else if (!existing) payload.poster = '';
  return payload;
}

// Loads an event and makes sure the logged-in club head owns it (403 otherwise).
async function loadOwnEvent(req) {
  const event = await Event.findById(req.params.id);
  if (!event) throw new ApiError(404, 'Event not found');
  if (!sameId(event.club, req.user.club)) throw new ApiError(403, 'This event belongs to another club');
  return event;
}

const notifyPresidents = async (event, title, message) => {
  const presidents = await User.find({ role: 'president', isActive: true }).select('_id');
  await notify(presidents.map((p) => p._id), { title, message, link: '/president/approvals', type: 'event_submitted' });
};

/* ---------- public / shared ---------- */

// GET /api/events - approved events of active clubs only
exports.list = asyncHandler(async (req, res) => {
  const { q, club, category, from, to, open, scope } = req.query;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 9, 1), 50);

  const activeClubs = await Club.find({ isActive: true }).select('_id').lean();
  const clubIds = activeClubs.map((c) => String(c._id));
  const filter = { status: 'approved' };

  if (club) {
    // accept id or slug
    const found = await Club.findOne(/^[a-f\d]{24}$/i.test(club) ? { _id: club } : { slug: String(club) }).select('_id isActive');
    filter.club = found && found.isActive ? found._id : null;
  } else {
    filter.club = { $in: clubIds };
  }
  if (category) filter.category = String(category);
  if (q) {
    const rx = new RegExp(escapeRegex(String(q).trim()), 'i');
    filter.$or = [{ title: rx }, { description: rx }, { tags: rx }, { venue: rx }];
  }

  const today = new Date(new Date().toISOString().slice(0, 10));
  const range = {};
  if (from) range.$gte = new Date(String(from));
  if (to) range.$lte = new Date(String(to));
  if (Object.keys(range).length) filter.date = range;
  else if (scope === 'past') filter.date = { $lt: today };
  else if (scope !== 'all') filter.date = { $gte: today }; // default: upcoming only

  if (open === 'true') {
    filter.registrationDeadline = { $gte: new Date() };
    filter.date = { ...(filter.date || {}), $gte: filter.date?.$gte && filter.date.$gte > today ? filter.date.$gte : today };
  }

  const [total, events] = await Promise.all([
    Event.countDocuments(filter),
    Event.find(filter)
      .populate('club', CLUB_FIELDS)
      .sort(scope === 'past' ? { date: -1 } : { date: 1, startTime: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);
  await decorate(events, req.user);
  ok(res, { events, total, page, pages: Math.ceil(total / limit) || 1 });
});

// GET /api/events/:id
exports.get = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id).populate('club', CLUB_FIELDS).lean();
  if (!event) throw new ApiError(404, 'Event not found');

  const u = req.user;
  const isPublic = event.status === 'approved' && event.club?.isActive;
  const isOwner = u?.role === 'club' && sameId(event.club, u.club);
  if (!isPublic && !isOwner && u?.role !== 'president') throw new ApiError(404, 'Event not found'); // hide existence

  await decorate([event], u);
  ok(res, event);
});

/* ---------- club head ---------- */

// GET /api/events/club/mine
exports.mine = asyncHandler(async (req, res) => {
  const filter = { club: req.user.club };
  if (req.query.status) filter.status = String(req.query.status);
  const events = await Event.find(filter).populate('club', CLUB_FIELDS).sort('-createdAt').lean();
  ok(res, await decorate(events, req.user));
});

// POST /api/events
exports.create = asyncHandler(async (req, res) => {
  const payload = buildPayload(req);
  if (eventStart(payload) <= new Date()) throw new ApiError(400, 'Event date must be in the future');
  const submit = toBool(req.body.submit);
  const event = await Event.create({ ...payload, club: req.user.club, status: submit ? 'pending' : 'draft' });
  if (submit) await notifyPresidents(event, 'New event awaiting approval', `"${event.title}" was submitted for review.`);
  ok(res, event, submit ? 'Event submitted for approval' : 'Event saved as draft', 201);
});

// PUT /api/events/:id
exports.update = asyncHandler(async (req, res) => {
  const event = await loadOwnEvent(req);
  if (event.status === 'pending') throw new ApiError(409, 'This event is under review and cannot be edited right now');

  const payload = buildPayload(req, event);
  const dateChanged = dateOnly(payload.date) !== dateOnly(event.date) || payload.startTime !== event.startTime;
  if (dateChanged && eventStart(payload) <= new Date()) throw new ApiError(400, 'Event date must be in the future');
  if (payload.volunteerCapacity && payload.volunteerCapacity < 1) throw new ApiError(400, 'Invalid volunteer capacity');

  // capacity can't drop below people already registered
  const registered = await Registration.countDocuments({ event: event._id, type: 'participation', status: 'registered' });
  if (payload.participantCapacity < registered) {
    throw new ApiError(400, `${registered} students are already registered; capacity cannot be lower than that`);
  }

  const wasApproved = event.status === 'approved';
  event.set(payload);
  if (wasApproved) {
    // Editing an approved event sends it back for re-approval.
    event.status = 'pending';
    event.approvedBy = undefined;
    event.approvedAt = undefined;
  } else if (toBool(req.body.submit)) {
    event.status = 'pending';
    event.rejectionReason = '';
  }
  await event.save();
  if (event.status === 'pending') await notifyPresidents(event, 'Event awaiting approval', `"${event.title}" was ${wasApproved ? 'edited and needs re-approval' : 'submitted for review'}.`);
  ok(res, event, wasApproved ? 'Event updated and sent back for approval' : event.status === 'pending' ? 'Event submitted for approval' : 'Event updated');
});

// PATCH /api/events/:id/submit  (draft or rejected -> pending)
exports.submit = asyncHandler(async (req, res) => {
  const event = await loadOwnEvent(req);
  if (!['draft', 'rejected'].includes(event.status)) throw new ApiError(409, `A ${event.status} event cannot be submitted`);
  if (eventStart(event) <= new Date()) throw new ApiError(400, 'Event date has passed; edit the date before submitting');
  event.status = 'pending';
  event.rejectionReason = '';
  await event.save();
  await notifyPresidents(event, 'New event awaiting approval', `"${event.title}" was submitted for review.`);
  ok(res, event, 'Event submitted for approval');
});

// DELETE /api/events/:id
exports.remove = asyncHandler(async (req, res) => {
  const event = await loadOwnEvent(req);
  await Promise.all([
    Registration.deleteMany({ event: event._id }),
    Announcement.deleteMany({ event: event._id }),
    event.deleteOne(),
  ]);
  ok(res, null, 'Event deleted');
});

/* ---------- president ---------- */

// GET /api/events/admin/all?status=&club=&q=
exports.adminAll = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = String(req.query.status);
  if (req.query.club) filter.club = String(req.query.club);
  if (req.query.q) filter.title = new RegExp(escapeRegex(String(req.query.q).trim()), 'i');
  const events = await Event.find(filter).populate('club', CLUB_FIELDS).sort('-createdAt').lean();
  ok(res, await decorate(events, req.user));
});

const headIds = async (clubId) => (await User.find({ club: clubId, role: 'club' }).select('_id')).map((u) => u._id);

// PATCH /api/events/:id/approve
exports.approve = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new ApiError(404, 'Event not found');
  if (event.status !== 'pending') throw new ApiError(409, 'Only pending events can be approved');
  event.status = 'approved';
  event.rejectionReason = '';
  event.approvedBy = req.user._id;
  event.approvedAt = new Date();
  await event.save();
  await notify(await headIds(event.club), {
    title: 'Event approved', message: `"${event.title}" is now live in the public events feed.`,
    link: '/club/events', type: 'event_approved',
  });
  ok(res, event, 'Event approved');
});

// PATCH /api/events/:id/reject   { reason }
exports.reject = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new ApiError(404, 'Event not found');
  if (event.status !== 'pending') throw new ApiError(409, 'Only pending events can be rejected');
  event.status = 'rejected';
  event.rejectionReason = req.body.reason;
  event.approvedBy = undefined;
  event.approvedAt = undefined;
  await event.save();
  await notify(await headIds(event.club), {
    title: 'Event rejected', message: `"${event.title}": ${req.body.reason}`,
    link: '/club/events', type: 'event_rejected',
  });
  ok(res, event, 'Event rejected');
});

exports.decorate = decorate;
