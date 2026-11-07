const router = require('express').Router();
const c = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');
const { validate, checkId } = require('../middleware/validate');

router.use(protect);
router.get('/', c.list);
router.patch('/read-all', c.markAllRead); // before /:id/read
router.patch('/:id/read', checkId(), validate, c.markRead);

module.exports = router;
