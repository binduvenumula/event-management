import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardLayout from './components/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/public/Home';
import Events from './pages/public/Events';
import EventDetails from './pages/public/EventDetails';
import Clubs from './pages/public/Clubs';
import ClubDetails from './pages/public/ClubDetails';
import Login from './pages/public/Login';
import Signup from './pages/public/Signup';
import NotFound from './pages/public/NotFound';

import StudentDashboard from './pages/student/StudentDashboard';
import MyRegistrations from './pages/student/MyRegistrations';
import Notifications from './pages/student/Notifications';
import Profile from './pages/common/Profile';

import ClubDashboard from './pages/club/ClubDashboard';
import ManageEvents from './pages/club/ManageEvents';
import CreateEditEvent from './pages/club/CreateEditEvent';
import EventRegistrations from './pages/club/EventRegistrations';
import VolunteerApplications from './pages/club/VolunteerApplications';
import ClubAnnouncements from './pages/club/ClubAnnouncements';
import ClubProfile from './pages/club/ClubProfile';

import PresidentDashboard from './pages/president/PresidentDashboard';
import ManageClubs from './pages/president/ManageClubs';
import EventApprovals from './pages/president/EventApprovals';
import AllEvents from './pages/president/AllEvents';
import AllRegistrations from './pages/president/AllRegistrations';

export default function App() {
  return (
    <Routes>
      {/* auth pages have their own split layout */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* public pages */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetails />} />
        <Route path="/clubs" element={<Clubs />} />
        <Route path="/clubs/:id" element={<ClubDetails />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* dashboards: sidebar layout, role protected */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['student']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/registrations" element={<MyRegistrations />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['club']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/club" element={<ClubDashboard />} />
          <Route path="/club/events" element={<ManageEvents />} />
          <Route path="/club/events/new" element={<CreateEditEvent />} />
          <Route path="/club/events/:id/edit" element={<CreateEditEvent />} />
          <Route path="/club/events/:id/registrations" element={<EventRegistrations />} />
          <Route path="/club/volunteers" element={<VolunteerApplications />} />
          <Route path="/club/announcements" element={<ClubAnnouncements />} />
          <Route path="/club/profile" element={<ClubProfile />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['president']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/president" element={<PresidentDashboard />} />
          <Route path="/president/clubs" element={<ManageClubs />} />
          <Route path="/president/approvals" element={<EventApprovals />} />
          <Route path="/president/events" element={<AllEvents />} />
          <Route path="/president/registrations" element={<AllRegistrations />} />
        </Route>
      </Route>
    </Routes>
  );
}
