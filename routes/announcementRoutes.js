// Mounted at /api/events/:id/announcements  (mergeParams gives access to :id)
const router = require('express').Router({ mergeParams: true });
const { body } = require('express-validator');
const c = require('../controllers/announcementController');
const { protect, optionalAuth, authorize } = require('../middleware/auth');
const { validate, checkId } = require('../middleware/validate');

router.get('/', checkId(), validate, optionalAuth, c.list);
router.post(
  '/',
  protect,
  authorize('club'),
  checkId(),
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 120 }),
  body('message').trim().notEmpty().withMessage('Message is required').isLength({ max: 1000 }),
  validate,
  c.create
);

module.exports = router;
