const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { ApiError } = require('../utils/helpers');

const ALLOWED = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ALLOWED[file.mimetype]}`),
});

// jpg / jpeg / png / webp up to 2 MB.
module.exports = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    ALLOWED[file.mimetype] ? cb(null, true) : cb(new ApiError(400, 'Only jpg, png or webp images are allowed')),
});
