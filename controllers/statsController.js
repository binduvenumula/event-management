const Club = require('../models/Club');
const Event = require('../models/Event');
const User = require('../models/User');
const Registration = require('../models/Registration');
const Notification = require('../models/Notification');
const { asyncHandler, ok } = require('../utils/helpers');

const todayUTC = () => new Date(new Date().toISOString().slice(0, 10));

// GET /api/stats/public - numbers for the home page strip (no login needed)
exports.publicStats = asyncHandler(async (_req, res) => {
  const activeClubs = await Club.find({ isActive: true }).select('_id').lean();
  const [clubs, upcomingEvents, students] = await Promise.all([
    Club.countDocuments({ isActive: true }),
    Event.countDocuments({ status: 'approved', club: { $in: activeClubs.map((c) => c._id) }, date: { $gte: todayUTC() } }),
    User.countDocuments({ role: 'student', isActive: true }),
  ]);
  ok(res, { clubs, upcomingEvents, students });
});

// GET /api/stats/president
exports.president = asyncHandler(async (_req, res) => {
  const [totalClubs, totalEvents, pendingApprovals, approvedEvents, totalStudents, totalParticipants, totalVolunteers, pendingVolunteers] =
    await Promise.all([
      Club.countDocuments(),
      Event.countDocuments(),
      Event.countDocuments({ status: 'pending' }),
      Event.countDocuments({ status: 'approved' }),
      User.countDocuments({ role: 'student' }),
      Registration.countDocuments({ type: 'participation', status: 'registered' }),
      Registration.countDocuments({ type: 'volunteer', status: 'approved' }),
      Registration.countDocuments({ type: 'volunteer', status: 'pending' }),
    ]);

  // registrations per club: events -> club
  const perClubAgg = await Registration.aggregate([
    { $match: { $or: [{ type: 'participation', status: 'registered' }, { type: 'volunteer', status: { $in: ['approved', 'pending'] } }] } },
    { $lookup: { from: 'events', localField: 'event', foreignField: '_id', as: 'ev' } },
    { $unwind: '$ev' },
    { $group: { _id: { club: '$ev.club', type: '$type' }, n: { $sum: 1 } } },
  ]);
  const clubs = await Club.find().select('name').sort('name').lean();
  const registrationsPerClub = clubs.map((c) => {
    const get = (type) => perClubAgg.find((a) => String(a._id.club) === String(c._id) && a._id.type === type)?.n || 0;
    return { club: c.name, participants: get('participation'), volunteers: get('volunteer') };
  });

  ok(res, { totalClubs, totalEvents, pendingApprovals, approvedEvents, totalStudents, totalParticipants, totalVolunteers, pendingVolunteers, registrationsPerClub });
});

// GET /api/stats/club
exports.club = asyncHandler(async (req, res) => {
  const clubId = req.user.club;
  const events = await Event.find({ club: clubId }).select('title status date participantCapacity').lean();
  const eventIds = events.map((e) => e._id);
  const byStatus = { draft: 0, pending: 0, approved: 0, rejected: 0 };
  events.forEach((e) => { byStatus[e.status] += 1; });

  const [participants, pendingVolunteers, approvedVolunteers, perEvent, pendingList] = await Promise.all([
    Registration.countDocuments({ event: { $in: eventIds }, type: 'participation', status: 'registered' }),
    Registration.countDocuments({ event: { $in: eventIds }, type: 'volunteer', status: 'pending' }),
    Registration.countDocuments({ event: { $in: eventIds }, type: 'volunteer', status: 'approved' }),
    Registration.aggregate([
      { $match: { event: { $in: eventIds }, $or: [{ type: 'participation', status: 'registered' }, { type: 'volunteer', status: { $in: ['approved', 'pending'] } }] } },
      { $group: { _id: { event: '$event', type: '$type' }, n: { $sum: 1 } } },
    ]),
    Registration.find({ event: { $in: eventIds }, type: 'volunteer', status: 'pending' })
      .populate('student', 'name email rollNumber branch year').populate('event', 'title').sort('-createdAt').limit(6).lean(),
  ]);

  const registrationsPerEvent = events
    .filter((e) => e.status === 'approved')
    .map((e) => {
      const get = (type) => perEvent.find((p) => String(p._id.event) === String(e._id) && p._id.type === type)?.n || 0;
      return { _id: e._id, title: e.title, date: e.date, capacity: e.participantCapacity, participants: get('participation'), volunteers: get('volunteer') };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const upcoming = events.filter((e) => e.status === 'approved' && e.date >= todayUTC()).length;
  ok(res, { totalEvents: events.length, byStatus, upcoming, participants, pendingVolunteers, approvedVolunteers, registrationsPerEvent, pendingVolunteerList: pendingList });
});

// GET /api/stats/student
exports.student = asyncHandler(async (req, res) => {
  const regs = await Registration.find({ student: req.user._id })
    .populate({ path: 'event', select: 'title date startTime venue poster category club status', populate: { path: 'club', select: 'name' } })
    .lean();
  const valid = regs.filter((r) => r.event);
  const today = todayUTC();

  const participation = valid.filter((r) => r.type === 'participation' && r.status === 'registered');
  const upcomingEvents = participation.filter((r) => r.event.date >= today).sort((a, b) => a.event.date - b.event.date).slice(0, 5);
  const volunteer = { pending: 0, approved: 0, rejected: 0, withdrawn: 0 };
  valid.filter((r) => r.type === 'volunteer').forEach((r) => { volunteer[r.status] += 1; });

  const [recentNotifications, unread] = await Promise.all([
    Notification.find({ user: req.user._id }).sort('-createdAt').limit(5).lean(),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);
  ok(res, {
    registeredCount: participation.length,
    upcomingCount: participation.filter((r) => r.event.date >= today).length,
    attendedCount: participation.filter((r) => r.event.date < today).length,
    volunteer,
    upcomingEvents,
    recentNotifications,
    unread,
  });
});

