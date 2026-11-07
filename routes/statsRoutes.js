const router = require('express').Router();
const c = require('../controllers/statsController');
const { protect, authorize } = require('../middleware/auth');

router.get('/public', c.publicStats);
router.get('/president', protect, authorize('president'), c.president);
router.get('/club', protect, authorize('club'), c.club);
router.get('/student', protect, authorize('student'), c.student);

module.exports = router;
