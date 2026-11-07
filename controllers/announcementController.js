const Event = require('../models/Event');
const Announcement = require('../models/Announcement');
const Registration = require('../models/Registration');
const { ApiError, asyncHandler, ok, sameId, notify } = require('../utils/helpers');

// POST /api/events/:id/announcements  (club head who owns the event)
exports.create = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new ApiError(404, 'Event not found');
  if (!sameId(event.club, req.user.club)) throw new ApiError(403, 'You can only post announcements for your own events');
  if (event.status !== 'approved') throw new ApiError(409, 'Announcements can only be posted for approved events');

  const announcement = await Announcement.create({
    event: event._id, club: event.club, title: req.body.title, message: req.body.message, createdBy: req.user._id,
  });

  // Everyone registered: participants + approved volunteers.
  const students = await Registration.distinct('student', {
    event: event._id,
    $or: [{ type: 'participation', status: 'registered' }, { type: 'volunteer', status: 'approved' }],
  });
  await notify(students, {
    title: `${event.title}: ${announcement.title}`, message: announcement.message,
    link: `/events/${event._id}`, type: 'announcement',
  });
  ok(res, { announcement, notified: students.length }, `Announcement posted. ${students.length} student(s) notified`, 201);
});

// GET /api/events/:id/announcements  (public for approved events)
exports.list = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new ApiError(404, 'Event not found');
  const u = req.user;
  const allowed = event.status === 'approved' || u?.role === 'president' || (u?.role === 'club' && sameId(event.club, u.club));
  if (!allowed) throw new ApiError(404, 'Event not found');
  const items = await Announcement.find({ event: event._id }).populate('createdBy', 'name').sort('-createdAt').lean();
  ok(res, items);
});

// GET /api/events/club/announcements - everything posted by the club head's club
exports.mine = asyncHandler(async (req, res) => {
  const items = await Announcement.find({ club: req.user.club }).populate('event', 'title').sort('-createdAt').lean();
  ok(res, items);
});
