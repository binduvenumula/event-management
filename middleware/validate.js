const { validationResult, param } = require('express-validator');

// Place after express-validator rules; answers 400 with the first message.
const validate = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
  return res.status(400).json({ success: false, message: errors[0].message, data: { errors } });
};

// Rejects malformed ObjectIds in route params.
const checkId = (name = 'id') => param(name).isMongoId().withMessage('Invalid id format');

// Strips Mongo operator keys ($ne, $gt...) from request input (NoSQL injection guard).
const sanitize = (req, _res, next) => {
  const clean = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$') || key.includes('.')) delete obj[key];
      else clean(obj[key]);
    }
  };
  clean(req.body);
  clean(req.query);
  clean(req.params);
  next();
};

module.exports = { validate, checkId, sanitize };
