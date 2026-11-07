const router = require('express').Router();
const { body } = require('express-validator');
const r = require('../controllers/registrationController');
const { protect, authorize } = require('../middleware/auth');
const { validate, checkId } = require('../middleware/validate');

router.get('/mine', protect, authorize('student'), r.mine);
router.get('/admin/all', protect, authorize('president'), r.adminAll);

router.patch(
  '/:id/review',
  protect,
  authorize('club'),
  checkId(),
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
  body('reviewNote').optional({ checkFalsy: true }).trim().isLength({ max: 300 }).withMessage('Note is too long (max 300)'),
  validate,
  r.review
);

module.exports = router;
