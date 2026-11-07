require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/error');
const { sanitize } = require('./middleware/validate');
const { protect, authorize } = require('./middleware/auth');

if (!process.env.JWT_SECRET || !process.env.MONGO_URI) {
  console.error('Missing JWT_SECRET or MONGO_URI. Copy server/.env.example to server/.env first.');
  process.exit(1);
}

const app = express();
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Safe default headers (helmet-style, no extra dependency).
app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cross-Origin-Resource-Policy': 'cross-origin', // posters are loaded by the client on another port
  });
  next();
});

app.use(cors({ origin: CLIENT_URL.split(','), credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(sanitize);
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (_req, res) => res.json({ success: true, message: 'VFSTR Events API is running', data: null }));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/clubs', require('./routes/clubRoutes'));
// must come before /events/:id/announcements, otherwise "club" would be read as an event id
app.get('/api/events/club/announcements', protect, authorize('club'), require('./controllers/announcementController').mine);
app.use('/api/events/:id/announcements', require('./routes/announcementRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/registrations', require('./routes/registrationRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/stats', require('./routes/statsRoutes'));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  const server = app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') console.error(`Port ${PORT} is already in use. Change PORT in server/.env or stop the other process.`);
    else console.error(err);
    process.exit(1);
  });
});

process.on('unhandledRejection', (err) => console.error('Unhandled rejection:', err));
