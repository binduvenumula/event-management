const router = require('express').Router();
const { body } = require('express-validator');
const e = require('../controllers/eventController');
const r = require('../controllers/registrationController');
const { protect, optionalAuth, authorize } = require('../middleware/auth');
const { validate, checkId } = require('../middleware/validate');
const upload = require('../middleware/upload');
const { EVENT_CATEGORIES } = require('../models/Event');
const { VOLUNTEER_ROLES } = require('../models/Registration');

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

// Event form rules (the same for create and update).
const eventRules = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 120 }).withMessage('Title is too long (max 120)'),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 3000 }),
  body('category').isIn(EVENT_CATEGORIES).withMessage('Invalid category'),
  body('date').isISO8601().withMessage('A valid event date is required'),
  body('startTime').matches(TIME).withMessage('Start time must be HH:MM'),
  body('endTime')
    .matches(TIME).withMessage('End time must be HH:MM')
    .custom((v, { req }) => v > req.body.startTime).withMessage('End time must be after start time'),
  body('venue').trim().notEmpty().withMessage('Venue is required'),
  body('registrationDeadline')
    .isISO8601().withMessage('A valid registration deadline is required')
    .custom((v, { req }) => {
      const start = new Date(`${String(req.body.date).slice(0, 10)}T${req.body.startTime}:00`);
      return new Date(v) < start;
    }).withMessage('Registration deadline must be before the event date'),
  body('participantCapacity').isInt({ min: 1, max: 100000 }).withMessage('Participant capacity must be at least 1'),
  body('volunteerCapacity').optional({ checkFalsy: true }).isInt({ min: 0, max: 10000 }).withMessage('Invalid volunteer capacity'),
  body('posterUrl').optional({ checkFalsy: true }).isURL({ require_protocol: false }).withMessage('Poster URL is not valid'),
];

const participationRules = [
  body('phone').matches(/^[0-9+\-\s]{10,15}$/).withMessage('Enter a valid phone number'),
  body('teamName').optional({ checkFalsy: true }).trim().isLength({ max: 80 }),
  body('additionalInfo').optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
];
const volunteerRules = [
  body('preferredRole').isIn(VOLUNTEER_ROLES).withMessage('Choose a preferred role'),
  body('availability').trim().notEmpty().withMessage('Tell us when you are available'),
  body('whyVolunteer').trim().notEmpty().withMessage('Please tell us why you want to volunteer').isLength({ max: 500 }),
  body('experience').optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
];

// Listings (fixed paths first so ":id" does not swallow them)
router.get('/', optionalAuth, e.list);
router.get('/club/mine', protect, authorize('club'), e.mine);
router.get('/admin/all', protect, authorize('president'), e.adminAll);

// Event CRUD
router.post('/', protect, authorize('club'), upload.single('poster'), eventRules, validate, e.create);
router.get('/:id', checkId(), validate, optionalAuth, e.get);
router.put('/:id', protect, authorize('club'), checkId(), upload.single('poster'), eventRules, validate, e.update);
router.delete('/:id', protect, authorize('club'), checkId(), validate, e.remove);
router.patch('/:id/submit', protect, authorize('club'), checkId(), validate, e.submit);

// Approval workflow
router.patch('/:id/approve', protect, authorize('president'), checkId(), validate, e.approve);
router.patch(
  '/:id/reject',
  protect, authorize('president'), checkId(),
  body('reason').trim().notEmpty().withMessage('A rejection reason is required').isLength({ max: 500 }),
  validate,
  e.reject
);

// Student registrations (participation and volunteering are separate)
router.post('/:id/participate', protect, authorize('student'), checkId(), participationRules, validate, r.participate);
router.delete('/:id/participate', protect, authorize('student'), checkId(), validate, r.cancelParticipation);
router.post('/:id/volunteer', protect, authorize('student'), checkId(), volunteerRules, validate, r.volunteer);
router.delete('/:id/volunteer', protect, authorize('student'), checkId(), validate, r.withdrawVolunteer);

// Club owner / president views
router.get('/:id/participants/export', protect, authorize('club', 'president'), checkId(), validate, r.exportParticipants);
router.get('/:id/participants', protect, authorize('club', 'president'), checkId(), validate, r.participants);
router.get('/:id/volunteers', protect, authorize('club', 'president'), checkId(), validate, r.volunteers);

module.exports = router;
