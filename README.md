# VFSTR Event Management System

A MERN-stack portal for **Vignan's Foundation for Science, Technology & Research**. Students discover events, register as participants or apply as volunteers. Club heads create events and run them. The President approves events and oversees everything.

* **Frontend:** React 18, Vite, React Router v6, Tailwind CSS v3, Axios, react-hot-toast, lucide-react
* **Backend:** Node.js, Express, Mongoose, JWT, bcryptjs, multer, express-validator
* **Database:** MongoDB

## Prerequisites

* Node.js 18 or newer
* MongoDB running locally on `mongodb://127.0.0.1:27017` (or a MongoDB Atlas URI)

## Setup

```bash
# 1. install dependencies
cd server && npm install
cd ../client && npm install

# 2. environment files
cp server/.env.example server/.env
cp client/.env.example client/.env      # on Windows cmd/PowerShell use `copy` instead of `cp`

# 3. fill the database with demo data (clears the DB first)
cd server && npm run seed

# 4. run (two terminals)
cd server && npm run dev     # API    -> http://localhost:5000
cd client && npm run dev     # Web UI -> http://localhost:5173
```

Optional shortcut from the project root (installs `concurrently` once, then starts both apps):

```bash
npm install && npm run dev
```

**Open the app at <http://localhost:5173>** (use `localhost`, not `127.0.0.1`: the API only allows the origin in `CLIENT_URL`).

### Environment variables

| File | Variable | Default |
|---|---|---|
| `server/.env` | `PORT` | `5000` |
| | `MONGO_URI` | `mongodb://127.0.0.1:27017/vfstr_events` (Atlas works too) |
| | `JWT_SECRET` | any long random string |
| | `CLIENT_URL` | `http://localhost:5173` (CORS origin, comma separate for several) |
| `client/.env` | `VITE_API_URL` | `http://localhost:5000/api` |

## Demo accounts (created by `npm run seed`)

| Role | Email | Password |
|---|---|---|
| President | `president@vfstr.edu` | `President@123` |
| Club head, Coding Club | `coding-club@vfstr.edu` | `Club@123` |
| Club head, Robotics Club | `robotics-club@vfstr.edu` | `Club@123` |
| Club head, Cultural Club | `cultural-club@vfstr.edu` | `Club@123` |
| Club head, Sports Club | `sports-club@vfstr.edu` | `Club@123` |
| Club head, Literary Club | `literary-club@vfstr.edu` | `Club@123` |
| Club head, NSS / Social Service Club | `nss-club@vfstr.edu` | `Club@123` |
| Students | `student1@vfstr.edu` ... `student10@vfstr.edu` | `Student@123` |

Seed data: 6 clubs, 14 events (8 approved incl. 2 past, 3 pending, 2 rejected with reasons, 1 draft), 52 registrations (participation plus volunteers in pending, approved and rejected states), announcements and notifications. It includes a full event ("Robotics Workshop", 5 seats), an event whose deadline has passed (Cricket Tournament) and events that do not need volunteers.

## Feature walkthrough

**Student**: sign up, then browse the approved-events feed with search, club, category, date range and "registration open" filters. Register as a participant and, separately, apply as a volunteer (two forms, two records). *My Registrations* has Participation and Volunteering tabs; cancel a participation before the deadline, withdraw a pending volunteer application. Bell icon with unread count, mark one / all as read.

**Club head** (one club per login): create, edit and delete own events. Lifecycle is `draft -> pending -> approved | rejected`; rejected events show the President's reason and can be edited and resubmitted; editing an approved event sends it back to pending (with a confirmation). View participants (search, filter, CSV export), review volunteers (approve / reject with a note), post announcements (registered students are notified) and edit the club profile (description, logo, banner, contact, socials).

**President**: dashboard with totals and a registrations-per-club bar chart; approvals queue with a review modal (poster, full details, Approve / Reject with required reason); create / edit / activate / deactivate / delete clubs together with the club head's login; all events and all registrations with filters.

## Business rules enforced by the API

* The public feed and direct fetch only ever return `approved` events of active clubs; non-approved events return 404 to students and anonymous users.
* Registration closes at `registrationDeadline` or after the event; participation capacity returns "Event full"; volunteer capacity is checked on approval.
* One participation and one volunteer record per student per event (unique index on `event + student + type`).
* A club head touching another club's event, registrations, volunteers or announcements gets `403`.
* Deactivated clubs / users cannot log in (existing tokens stop working) and their events leave the feed.
* Signup always creates a `student`; a role sent by the client is ignored.
* Notifications are created when an event is submitted (to the President), approved or rejected (to the club head), a volunteer is approved or rejected (to the student) and an announcement is posted (to registered students).

## API routes (prefix `/api`, responses `{ success, message, data }`)

```
AUTH      POST /auth/signup  POST /auth/login  GET /auth/me  PUT /auth/profile  PUT /auth/change-password
CLUBS     GET /clubs  GET /clubs/:idOrSlug
          POST /clubs  PUT /clubs/:id  PATCH /clubs/:id/status  DELETE /clubs/:id      (president)
          PUT /clubs/my/profile                                                          (club)
EVENTS    GET /events  (q, club, category, from, to, open=true, scope=upcoming|past|all, page, limit)
          GET /events/:id
          GET /events/club/mine                                                          (club)
          POST /events  PUT /events/:id  DELETE /events/:id  PATCH /events/:id/submit    (club, own only)
          GET /events/admin/all?status=&club=&q=                                         (president)
          PATCH /events/:id/approve  PATCH /events/:id/reject {reason}                   (president)
REGISTER  POST|DELETE /events/:id/participate   POST|DELETE /events/:id/volunteer        (student)
          GET /registrations/mine?type=                                                  (student)
          GET /events/:id/participants  GET /events/:id/volunteers                       (club owner / president)
          GET /events/:id/participants/export                                            (CSV)
          PATCH /registrations/:id/review {status, reviewNote}                           (club owner)
          GET /registrations/admin/all?type=&club=&event=&status=                        (president)
ANNOUNCE  POST /events/:id/announcements   GET /events/:id/announcements
          GET /events/club/announcements                                                 (club)
NOTIFY    GET /notifications  PATCH /notifications/:id/read  PATCH /notifications/read-all
STATS     GET /stats/public  GET /stats/president  GET /stats/club  GET /stats/student
```

Posters: upload `poster` (jpg, png, webp, max 2 MB) as multipart, or send `posterUrl`. Files are served from `/uploads`. Events without a poster show a gradient placeholder.

## Testing

With the API running and freshly seeded:

```bash
cd server && npm run smoke
```

The smoke test runs about 70 API checks (auth, roles, 403 ownership, draft/pending/rejected visibility, approval workflow, capacity, deadline, duplicates, volunteer review, announcements and notifications, CSV export, stats). It changes data, so run `npm run seed` again afterwards.

## Folder structure

```
vfstr-event-system/
├── README.md, package.json (optional root scripts)
├── server/
│   ├── server.js, seed.js, smoke.js, .env.example
│   ├── config/db.js
│   ├── models/       User Club Event Registration Announcement Notification
│   ├── middleware/   auth (protect, optionalAuth, authorize) error upload validate
│   ├── controllers/  auth club event registration announcement notification stats
│   ├── routes/       one file per controller
│   ├── utils/helpers.js
│   └── uploads/      poster images
└── client/
    ├── index.html, vite.config.js, tailwind.config.js
    └── src/
        ├── main.jsx, App.jsx, index.css
        ├── api/axios.js            base URL, token interceptor, 401 handling
        ├── context/AuthContext.jsx
        ├── components/             Navbar, Footer, EventCard, ClubCard, StatCard, StatusBadge, Modal,
        │                           ProtectedRoute, SearchFilterBar, EventForm, RegistrationModal,
        │                           NotificationBell, DashboardLayout, EventReviewModal, ...
        ├── pages/public/           Home Events EventDetails Clubs ClubDetails Login Signup NotFound
        ├── pages/student/          StudentDashboard MyRegistrations Notifications
        ├── pages/club/             ClubDashboard ManageEvents CreateEditEvent EventRegistrations
        │                           VolunteerApplications ClubAnnouncements ClubProfile
        ├── pages/president/        PresidentDashboard ManageClubs EventApprovals AllEvents AllRegistrations
        ├── pages/common/Profile.jsx
        └── utils/                  constants, formatDate, eventState
```

## Troubleshooting

| Problem | Fix |
|---|---|
| `MongoDB connection failed` | Start MongoDB (`mongod`, or the MongoDB service on Windows) or fix `MONGO_URI` in `server/.env`. |
| `Port 5000 is already in use` | Stop the other process or change `PORT` in `server/.env` **and** `VITE_API_URL` in `client/.env`. |
| `Missing JWT_SECRET or MONGO_URI` | You skipped `cp server/.env.example server/.env`. |
| CORS error / "Cannot reach the server" in the browser | Open the app at `http://localhost:5173` (not `127.0.0.1`), or set `CLIENT_URL` in `server/.env` to the exact origin you use, then restart the API. |
| Login fails after reseeding | Log in again; old tokens point to users that no longer exist. |
| Images do not load | Seed posters use Unsplash URLs (need internet). Cards fall back to a gradient automatically. |
| Changed `client/.env` has no effect | Restart `npm run dev` for the client; Vite reads env files at start. |
