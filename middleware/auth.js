const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Club = require('../models/Club');
const { ApiError, asyncHandler } = require('../utils/helpers');

// Reads the Bearer token and returns the user (or null when there is no token).
async function userFromRequest(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  let decoded;
  try {
    decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET);
  } catch {
    throw new ApiError(401, 'Session expired or invalid token. Please log in again.');
  }
  const user = await User.findById(decoded.id);
  if (!user) throw new ApiError(401, 'User no longer exists');
  if (!user.isActive) throw new ApiError(401, 'Your account has been deactivated');
  if (user.role === 'club') {
    const club = await Club.findById(user.club).select('isActive');
    if (!club || !club.isActive) throw new ApiError(401, 'Your club has been deactivated');
  }
  return user;
}

// Requires a valid login.
const protect = asyncHandler(async (req, _res, next) => {
  const user = await userFromRequest(req);
  if (!user) throw new ApiError(401, 'Please log in to continue');
  req.user = user;
  next();
});

// Attaches req.user if a token is present, but allows anonymous access.
const optionalAuth = asyncHandler(async (req, _res, next) => {
  req.user = await userFromRequest(req);
  next();
});

// Restricts a route to the given roles: authorize('club', 'president')
const authorize = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new ApiError(403, 'You do not have permission to perform this action'));
  }
  next();
};

module.exports = { protect, optionalAuth, authorize };
