const router = require('express').Router();
const { body } = require('express-validator');
const c = require('../controllers/clubController');
const { protect, optionalAuth, authorize } = require('../middleware/auth');
const { validate, checkId } = require('../middleware/validate');
const upload = require('../middleware/upload');
const { CLUB_CATEGORIES } = require('../models/Club');

const clubFields = [
  body('name').trim().notEmpty().withMessage('Club name is required').isLength({ max: 80 }),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 2000 }),
  body('category').isIn(CLUB_CATEGORIES).withMessage('Invalid club category'),
  body('contactEmail').optional({ checkFalsy: true }).isEmail().withMessage('Enter a valid contact email'),
];
const headFields = (required) => {
  const opt = (chain) => (required ? chain : chain.optional({ checkFalsy: true }));
  return [
    opt(body('head.name').trim().notEmpty().withMessage('Head name is required')),
    opt(body('head.email').trim().isEmail().withMessage('Enter a valid head email')),
    opt(body('head.password').isLength({ min: 6 }).withMessage('Head password must be at least 6 characters')),
  ];
};

router.get('/', optionalAuth, c.list);

// club head edits own profile (declared before /:id routes)
router.put(
  '/my/profile',
  protect,
  authorize('club'),
  upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'banner', maxCount: 1 }]),
  [
    body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
    body('contactEmail').optional({ checkFalsy: true }).isEmail().withMessage('Enter a valid contact email'),
  ],
  validate,
  c.updateMyProfile
);

router.get('/:id', optionalAuth, c.get);
router.post('/', protect, authorize('president'), clubFields, headFields(true), validate, c.create);
router.put('/:id', protect, authorize('president'), checkId(), clubFields, headFields(false), validate, c.update);
router.patch('/:id/status', protect, authorize('president'), checkId(), validate, c.setStatus);
router.delete('/:id', protect, authorize('president'), checkId(), validate, c.remove);

module.exports = router;
