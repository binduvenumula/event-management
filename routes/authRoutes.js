const router = require('express').Router();
const { body } = require('express-validator');
const c = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { ApiError } = require('../utils/helpers');

// Tiny in-memory login rate limiter: 30 attempts per minute per IP.
const hits = new Map();
const loginLimiter = (req, _res, next) => {
  const now = Date.now();
  const entry = (hits.get(req.ip) || []).filter((t) => now - t < 60000);
  entry.push(now);
  hits.set(req.ip, entry);
  if (entry.length > 30) return next(new ApiError(429, 'Too many login attempts. Try again in a minute.'));
  next();
};

const phone = body('phone').optional({ checkFalsy: true }).matches(/^[0-9+\-\s]{10,15}$/).withMessage('Enter a valid phone number');

router.post(
  '/signup',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 80 }),
    body('email').trim().isEmail().withMessage('Enter a valid email').normalizeEmail({ gmail_remove_dots: false }),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('rollNumber').trim().notEmpty().withMessage('Roll number is required'),
    body('branch').trim().notEmpty().withMessage('Branch is required'),
    body('year').isInt({ min: 1, max: 5 }).withMessage('Year must be between 1 and 5'),
    body('phone').matches(/^[0-9+\-\s]{10,15}$/).withMessage('Enter a valid phone number'),
  ],
  validate,
  c.signup
);

router.post(
  '/login',
  loginLimiter,
  [body('email').trim().isEmail().withMessage('Enter a valid email'), body('password').notEmpty().withMessage('Password is required')],
  validate,
  c.login
);

router.get('/me', protect, c.me);

router.put(
  '/profile',
  protect,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    phone,
    body('year').optional({ checkFalsy: true }).isInt({ min: 1, max: 5 }).withMessage('Year must be between 1 and 5'),
  ],
  validate,
  c.updateProfile
);

router.put(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validate,
  c.changePassword
);

module.exports = router;
