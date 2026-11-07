const Notification = require('../models/Notification');
const { ApiError, asyncHandler, ok } = require('../utils/helpers');

// GET /api/notifications  -> { items, unread }
exports.list = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const [items, unread] = await Promise.all([
    Notification.find({ user: req.user._id }).sort('-createdAt').limit(limit).lean(),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);
  ok(res, { items, unread });
});

// PATCH /api/notifications/:id/read
exports.markRead = asyncHandler(async (req, res) => {
  const n = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { isRead: true }, { new: true });
  if (!n) throw new ApiError(404, 'Notification not found');
  ok(res, n);
});

// PATCH /api/notifications/read-all
exports.markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  ok(res, null, 'All notifications marked as read');
});
