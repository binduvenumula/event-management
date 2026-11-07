export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
// Uploaded posters are served from the API origin, e.g. http://localhost:5000/uploads/x.jpg
export const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

export const EVENT_CATEGORIES = [
  'Technical', 'Cultural', 'Sports', 'Literary', 'Social Service',
  'Workshop', 'Competition', 'Entrepreneurship', 'Other',
];
export const CLUB_CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Literary', 'Social Service', 'Entrepreneurship', 'Other'];
export const VOLUNTEER_ROLES = ['Logistics', 'Registration Desk', 'Publicity', 'Stage', 'Tech Support', 'Hospitality', 'Other'];
export const BRANCHES = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AI&DS', 'Other'];

export const dashboardPath = (role) => ({ president: '/president', club: '/club', student: '/student' }[role] || '/');

// Gradient fallbacks for events/clubs without a poster (picked by title so each card is stable).
const GRADIENTS = [
  'from-blue-700 to-cyan-400', 'from-indigo-700 to-blue-400', 'from-navy to-royal',
  'from-cyan-600 to-blue-400', 'from-violet-700 to-blue-500', 'from-blue-900 to-cyan-500',
];
export const gradientFor = (text = '') => GRADIENTS[[...text].reduce((a, c) => a + c.charCodeAt(0), 0) % GRADIENTS.length];

// Turns "/uploads/a.jpg" into a full URL; leaves absolute URLs alone.
export const assetUrl = (p) => (!p ? '' : /^(https?:|blob:|data:)/i.test(p) ? p : `${API_ORIGIN}${p}`);
