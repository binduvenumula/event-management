const mongoose = require('mongoose');
const Club = require('../models/Club');
const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Announcement = require('../models/Announcement');
const { ApiError, asyncHandler, ok, slugify } = require('../utils/helpers');

const EDITABLE = ['name', 'description', 'category', 'contactEmail', 'logo', 'banner'];

// Finds a club by ObjectId or slug.
const findClub = async (idOrSlug) => {
  const query = mongoose.isValidObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: String(idOrSlug).toLowerCase() };
  return Club.findOne(query).populate('head', 'name email isActive');
};

// GET /api/clubs   (president may pass ?all=true to include deactivated clubs)
exports.list = asyncHandler(async (req, res) => {
  const filter = req.user?.role === 'president' && req.query.all === 'true' ? {} : { isActive: true };
  if (req.query.category) filter.category = String(req.query.category);
  const clubs = await Club.find(filter).populate('head', 'name email isActive').sort('name').lean();

  // number of approved events per club
  const counts = await Event.aggregate([
    { $match: { status: 'approved', club: { $in: clubs.map((c) => c._id) } } },
    { $group: { _id: '$club', n: { $sum: 1 } } },
  ]);
  const map = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
  clubs.forEach((c) => { c.eventCount = map[String(c._id)] || 0; });
  ok(res, clubs);
});

// GET /api/clubs/:id  - club plus its approved events
exports.get = asyncHandler(async (req, res) => {
  const club = await findClub(req.params.id);
  if (!club || (!club.isActive && req.user?.role !== 'president')) throw new ApiError(404, 'Club not found');
  const events = await Event.find({ club: club._id, status: 'approved' }).sort('date').lean();
  ok(res, { ...club.toObject(), events });
});

// POST /api/clubs  - also creates the club head's login
exports.create = asyncHandler(async (req, res) => {
  const { name, description, category, contactEmail, logo, banner, head } = req.body;
  const slug = req.body.slug ? slugify(req.body.slug) : slugify(name);
  if (await Club.findOne({ $or: [{ name }, { slug }] })) throw new ApiError(409, 'A club with this name already exists');
  if (await User.findOne({ email: head.email.toLowerCase() })) throw new ApiError(409, 'The head email is already registered');

  const club = await Club.create({
    name, slug, description, category, contactEmail, logo, banner,
    socialLinks: { instagram: req.body.socialLinks?.instagram || '', linkedin: req.body.socialLinks?.linkedin || '' },
  });
  try {
    const user = await User.create({ name: head.name, email: head.email, password: head.password, role: 'club', club: club._id });
    club.head = user._id;
    await club.save();
  } catch (err) {
    await Club.findByIdAndDelete(club._id); // roll back so we never leave a head-less club
    throw err;
  }
  ok(res, await findClub(club._id), 'Club and head login created', 201);
});

// PUT /api/clubs/:id  (president) - may also update the head's name/email/password
exports.update = asyncHandler(async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club) throw new ApiError(404, 'Club not found');
  EDITABLE.forEach((f) => { if (req.body[f] !== undefined) club[f] = req.body[f]; });
  if (req.body.name) club.slug = slugify(req.body.name);
  if (req.body.socialLinks) {
    if (req.body.socialLinks.instagram !== undefined) club.socialLinks.instagram = req.body.socialLinks.instagram;
    if (req.body.socialLinks.linkedin !== undefined) club.socialLinks.linkedin = req.body.socialLinks.linkedin;
  }

  const h = req.body.head;
  if (h && club.head) {
    const headUser = await User.findById(club.head).select('+password');
    if (h.email && h.email.toLowerCase() !== headUser.email) {
      if (await User.findOne({ email: h.email.toLowerCase() })) throw new ApiError(409, 'That head email is already registered');
      headUser.email = h.email;
    }
    if (h.name) headUser.name = h.name;
    if (h.password) headUser.password = h.password;
    await headUser.save();
  }
  await club.save();
  ok(res, await findClub(club._id), 'Club updated');
});

// PATCH /api/clubs/:id/status  - activate / deactivate (also locks the head's login)
exports.setStatus = asyncHandler(async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club) throw new ApiError(404, 'Club not found');
  club.isActive = typeof req.body.isActive === 'boolean' ? req.body.isActive : !club.isActive;
  await club.save();
  if (club.head) await User.findByIdAndUpdate(club.head, { isActive: club.isActive });
  ok(res, await findClub(club._id), club.isActive ? 'Club activated' : 'Club deactivated');
});

// DELETE /api/clubs/:id  - removes the club, its head, events, registrations and announcements
exports.remove = asyncHandler(async (req, res) => {
  const club = await Club.findById(req.params.id);
  if (!club) throw new ApiError(404, 'Club not found');
  const eventIds = (await Event.find({ club: club._id }).select('_id')).map((e) => e._id);
  await Promise.all([
    Registration.deleteMany({ event: { $in: eventIds } }),
    Announcement.deleteMany({ event: { $in: eventIds } }),
    Event.deleteMany({ club: club._id }),
    User.deleteMany({ club: club._id, role: 'club' }),
    club.deleteOne(),
  ]);
  ok(res, null, 'Club deleted');
});

// PUT /api/clubs/my/profile  (club head) - description, logo, banner, contact, socials
exports.updateMyProfile = asyncHandler(async (req, res) => {
  const club = await Club.findById(req.user.club);
  if (!club) throw new ApiError(404, 'Club not found');
  if (req.body.description !== undefined) club.description = req.body.description;
  if (req.body.contactEmail !== undefined) club.contactEmail = req.body.contactEmail;
  const social = req.body.socialLinks || {};
  const ig = social.instagram ?? req.body.instagram;
  const li = social.linkedin ?? req.body.linkedin;
  if (ig !== undefined) club.socialLinks.instagram = ig;
  if (li !== undefined) club.socialLinks.linkedin = li;
  // uploaded files win over URL fields
  if (req.files?.logo?.[0]) club.logo = `/uploads/${req.files.logo[0].filename}`;
  else if (req.body.logo !== undefined) club.logo = req.body.logo;
  if (req.files?.banner?.[0]) club.banner = `/uploads/${req.files.banner[0].filename}`;
  else if (req.body.banner !== undefined) club.banner = req.body.banner;
  await club.save();
  ok(res, await findClub(club._id), 'Club profile updated');
});
