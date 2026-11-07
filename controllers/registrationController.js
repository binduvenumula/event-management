const Event = require('../models/Event');
const Registration = require('../models/Registration');
const User = require('../models/User');
const { ApiError, asyncHandler, ok, escapeRegex, sameId, closedReason, notify } = require('../utils/helpers');

/* ---------- helpers ---------- */

// An event students can currently register for: approved, club active, not closed.
async function loadOpenEvent(id) {
  const event = await Event.findById(id).populate('club', 'isActive name');
  if (!event || event.status !== 'approved' || !event.club?.isActive) throw new ApiError(404, 'Event not found');
  const reason = closedReason(event);
  if (reason) throw new ApiError(400, reason);
  return event;
}

// Club head must own the event; the president may view any event.
async function loadViewableEvent(req) {
  const event = await Event.findById(req.params.id);
  if (!event) throw new ApiError(404, 'Event not found');
  if (req.user.role === 'club' && !sameId(event.club, req.user.club)) {
    throw new ApiError(403, "You cannot access another club's event");
  }
  return event;
}

const STUDENT_FIELDS = 'name email rollNumber branch year phone';

// Builds the list query for participants / volunteers (status + search filters).
async function listFor(req, type) {
  const event = await loadViewableEvent(req);
  const filter = { event: event._id, type };
  if (req.query.status) filter.status = String(req.query.status);
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(String(req.query.q).trim()), 'i');
    const students = await User.find({ $or: [{ name: rx }, { email: rx }, { rollNumber: rx }] }).select('_id');
    filter.student = { $in: students.map((s) => s._id) };
  }
  const registrations = await Registration.find(filter).populate('student', STUDENT_FIELDS).sort('-createdAt').lean();
  return { event, registrations };
}

/* ---------- participation ---------- */

// POST /api/events/:id/participate
exports.participate = asyncHandler(async (req, res) => {
  const event = await loadOpenEvent(req.params.id);
  const existing = await Registration.findOne({ event: event._id, student: req.user._id, type: 'participation' });
  if (existing && existing.status === 'registered') throw new ApiError(409, 'You are already registered for this event');

  const taken = await Registration.countDocuments({ event: event._id, type: 'participation', status: 'registered' });
  if (taken >= event.participantCapacity) throw new ApiError(409, 'Event full - no seats are left');

  const data = { teamName: req.body.teamName, phone: req.body.phone, additionalInfo: req.body.additionalInfo, status: 'registered' };
  let reg;
  if (existing) { // previously cancelled: re-register
    existing.set(data);
    reg = await existing.save();
  } else {
    reg = await Registration.create({ ...data, event: event._id, student: req.user._id, type: 'participation' });
  }
  ok(res, reg, 'You are registered for this event', 201);
});

// DELETE /api/events/:id/participate  - allowed until the deadline
exports.cancelParticipation = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new ApiError(404, 'Event not found');
  const reg = await Registration.findOne({ event: event._id, student: req.user._id, type: 'participation', status: 'registered' });
  if (!reg) throw new ApiError(404, 'You are not registered for this event');
  const reason = closedReason(event);
  if (reason) throw new ApiError(400, `Cancellation is closed. ${reason}.`);
  reg.status = 'cancelled';
  await reg.save();
  ok(res, reg, 'Registration cancelled');
});

/* ---------- volunteering ---------- */

// POST /api/events/:id/volunteer
exports.volunteer = asyncHandler(async (req, res) => {
  const event = await loadOpenEvent(req.params.id);
  if (!event.isVolunteerNeeded) throw new ApiError(400, 'This event does not need volunteers');

  const existing = await Registration.findOne({ event: event._id, student: req.user._id, type: 'volunteer' });
  if (existing && ['pending', 'approved'].includes(existing.status)) {
    throw new ApiError(409, `You have already applied as a volunteer (${existing.status})`);
  }
  if (existing && existing.status === 'rejected') throw new ApiError(409, 'Your volunteer application for this event was rejected');

  const data = {
    preferredRole: req.body.preferredRole, availability: req.body.availability,
    experience: req.body.experience, whyVolunteer: req.body.whyVolunteer,
    status: 'pending', reviewNote: '', reviewedAt: undefined,
  };
  let reg;
  if (existing) { // previously withdrawn: apply again
    existing.set(data);
    reg = await existing.save();
  } else {
    reg = await Registration.create({ ...data, event: event._id, student: req.user._id, type: 'volunteer' });
  }
  ok(res, reg, 'Volunteer application submitted', 201);
});

// DELETE /api/events/:id/volunteer  - only while pending
exports.withdrawVolunteer = asyncHandler(async (req, res) => {
  const reg = await Registration.findOne({ event: req.params.id, student: req.user._id, type: 'volunteer' });
  if (!reg) throw new ApiError(404, 'You have not applied to volunteer for this event');
  if (reg.status !== 'pending') throw new ApiError(400, `Only pending applications can be withdrawn (yours is ${reg.status})`);
  reg.status = 'withdrawn';
  await reg.save();
  ok(res, reg, 'Application withdrawn');
});

/* ---------- student views ---------- */

// GET /api/registrations/mine?type=
exports.mine = asyncHandler(async (req, res) => {
  const filter = { student: req.user._id };
  if (['participation', 'volunteer'].includes(req.query.type)) filter.type = req.query.type;
  const regs = await Registration.find(filter)
    .populate({ path: 'event', populate: { path: 'club', select: 'name slug' } })
    .sort('-createdAt')
    .lean();
  ok(res, regs.filter((r) => r.event)); // skip registrations whose event was deleted
});

/* ---------- club owner / president views ---------- */

exports.participants = asyncHandler(async (req, res) => {
  const { event, registrations } = await listFor(req, 'participation');
  ok(res, { event: { _id: event._id, title: event.title, participantCapacity: event.participantCapacity }, registrations });
});

exports.volunteers = asyncHandler(async (req, res) => {
  const { event, registrations } = await listFor(req, 'volunteer');
  ok(res, { event: { _id: event._id, title: event.title, volunteerCapacity: event.volunteerCapacity }, registrations });
});

// Quote a CSV cell; neutralise spreadsheet formulas (=, +, -, @).
const cell = (v) => {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

// GET /api/events/:id/participants/export
exports.exportParticipants = asyncHandler(async (req, res) => {
  const { event, registrations } = await listFor(req, 'participation');
  const header = ['Name', 'Email', 'Roll Number', 'Branch', 'Year', 'Phone', 'Team', 'Additional Info', 'Status', 'Registered On'];
  const rows = registrations.map((r) => [
    r.student?.name, r.student?.email, r.student?.rollNumber, r.student?.branch, r.student?.year,
    r.phone || r.student?.phone, r.teamName, r.additionalInfo, r.status, new Date(r.createdAt).toISOString(),
  ]);
  const csv = [header, ...rows].map((row) => row.map(cell).join(',')).join('\r\n');
  const name = event.title.replace(/[^a-z0-9]+/gi, '_').slice(0, 40);
  res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${name}_participants.csv"` });
  res.send('﻿' + csv);
});

// PATCH /api/registrations/:id/review   { status, reviewNote }  (volunteers only)
exports.review = asyncHandler(async (req, res) => {
  const reg = await Registration.findById(req.params.id).populate('event');
  if (!reg) throw new ApiError(404, 'Registration not found');
  if (reg.type !== 'volunteer') throw new ApiError(400, 'Only volunteer applications can be reviewed');
  if (!sameId(reg.event.club, req.user.club)) throw new ApiError(403, "You cannot review another club's volunteers");
  if (reg.status === 'withdrawn') throw new ApiError(400, 'The student withdrew this application');

  const { status, reviewNote } = req.body;
  if (status === 'approved' && reg.status !== 'approved') {
    const approved = await Registration.countDocuments({ event: reg.event._id, type: 'volunteer', status: 'approved' });
    if (approved >= reg.event.volunteerCapacity) throw new ApiError(409, 'Volunteer capacity is already full');
  }
  reg.status = status;
  reg.reviewNote = reviewNote || '';
  reg.reviewedAt = new Date();
  await reg.save();

  await notify([reg.student], {
    title: status === 'approved' ? 'Volunteer application approved' : 'Volunteer application rejected',
    message: `Your application for "${reg.event.title}" was ${status}.${reviewNote ? ` Note: ${reviewNote}` : ''}`,
    link: '/student/registrations?tab=volunteer',
    type: status === 'approved' ? 'volunteer_approved' : 'volunteer_rejected',
  });
  ok(res, reg, `Application ${status}`);
});

// GET /api/registrations/admin/all?type=&club=&event=&status=   (president)
exports.adminAll = asyncHandler(async (req, res) => {
  const filter = {};
  if (['participation', 'volunteer'].includes(req.query.type)) filter.type = req.query.type;
  if (req.query.status) filter.status = String(req.query.status);
  if (req.query.event) filter.event = String(req.query.event);
  else if (req.query.club) {
    const ids = await Event.find({ club: String(req.query.club) }).select('_id');
    filter.event = { $in: ids.map((e) => e._id) };
  }
  const regs = await Registration.find(filter)
    .populate('student', STUDENT_FIELDS)
    .populate({ path: 'event', select: 'title date club', populate: { path: 'club', select: 'name' } })
    .sort('-createdAt')
    .limit(1000)
    .lean();
  ok(res, regs.filter((r) => r.event && r.student));
});
