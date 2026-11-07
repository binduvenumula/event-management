const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Club = require('../models/Club');
const { ApiError, asyncHandler, ok } = require('../utils/helpers');

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// Load a user with their club info for the client.
const publicUser = async (id) => User.findById(id).populate('club', 'name slug logo isActive');

// POST /api/auth/signup  - always creates a student; any "role" in the body is ignored.
exports.signup = asyncHandler(async (req, res) => {
  const { name, email, password, rollNumber, branch, year, phone } = req.body;
  if (await User.findOne({ email: email.toLowerCase() })) throw new ApiError(409, 'An account with this email already exists');
  const user = await User.create({ name, email, password, rollNumber, branch, year, phone, role: 'student' });
  ok(res, { token: signToken(user._id), user: await publicUser(user._id) }, 'Account created', 201);
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(req.body.password))) throw new ApiError(401, 'Invalid email or password');
  if (!user.isActive) throw new ApiError(403, 'Your account has been deactivated. Contact the President.');
  if (user.role === 'club') {
    const club = await Club.findById(user.club).select('isActive');
    if (!club || !club.isActive) throw new ApiError(403, 'Your club is deactivated. Contact the President.');
  }
  ok(res, { token: signToken(user._id), user: await publicUser(user._id) }, 'Logged in');
});

// GET /api/auth/me
exports.me = asyncHandler(async (req, res) => ok(res, await publicUser(req.user._id)));

// PUT /api/auth/profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const fields = req.user.role === 'student' ? ['name', 'phone', 'rollNumber', 'branch', 'year'] : ['name', 'phone'];
  fields.forEach((f) => { if (req.body[f] !== undefined) req.user[f] = req.body[f]; });
  await req.user.save();
  ok(res, await publicUser(req.user._id), 'Profile updated');
});

// PUT /api/auth/change-password
exports.changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(req.body.currentPassword))) throw new ApiError(400, 'Current password is incorrect');
  user.password = req.body.newPassword;
  await user.save();
  ok(res, null, 'Password changed');
});
