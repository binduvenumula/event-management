const multer = require('multer');

const notFound = (req, res) =>
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}`, data: null });

// Global error handler - always answers with { success:false, message, data }
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message || 'Server error';

  if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid id format';
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || {})[0];
    message = field === 'event' || field === 'student'
      ? 'You have already submitted this form for this event'
      : `${field || 'Value'} already exists`;
  } else if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err instanceof multer.MulterError) {
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'Image must be 2 MB or smaller' : err.message;
  }

  if (status >= 500) console.error(err);
  res.status(status).json({ success: false, message, data: null });
};

module.exports = { notFound, errorHandler };
