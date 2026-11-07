import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Bell, CalendarCheck, CalendarPlus, CheckSquare, ClipboardList, Heart, LayoutDashboard, Megaphone,
  Menu, Search, ShieldCheck, User, Users, X, Building2, CalendarDays, UserCog,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';

// Sidebar entries per role.
const NAV = {
  student: [
    { to: '/student', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/student/registrations', label: 'My Registrations', icon: ClipboardList },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/events', label: 'Browse Events', icon: Search },
    { to: '/profile', label: 'My Profile', icon: User },
  ],
  club: [
    { to: '/club', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/club/events', label: 'My Events', icon: CalendarDays, end: true },
    { to: '/club/events/new', label: 'Create Event', icon: CalendarPlus },
    { to: '/club/volunteers', label: 'Volunteers', icon: Heart },
    { to: '/club/announcements', label: 'Announcements', icon: Megaphone },
    { to: '/club/profile', label: 'Club Profile', icon: Building2 },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/profile', label: 'My Account', icon: User },
  ],
  president: [
    { to: '/president', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/president/approvals', label: 'Event Approvals', icon: CheckSquare },
    { to: '/president/clubs', label: 'Manage Clubs', icon: Users },
    { to: '/president/events', label: 'All Events', icon: CalendarCheck },
    { to: '/president/registrations', label: 'Registrations', icon: ShieldCheck },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/profile', label: 'My Account', icon: UserCog },
  ],
};

// Navbar on top, sidebar on the left (becomes a slide-in drawer below lg).
export default function DashboardLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [location.pathname]);

  const items = NAV[user.role] || [];
  const roleLabel = user.role === 'club' ? user.club?.name || 'Club head' : user.role === 'president' ? 'President' : 'Student';

  const sidebar = (
    <nav className="flex h-full flex-col gap-1 p-3" aria-label="Dashboard">
      <p className="mb-2 px-3 pt-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{roleLabel}</p>
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to + label} to={to} end={end}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-royal text-white shadow-sm' : 'text-slate-600 hover:bg-sky hover:text-navy'}`
          }
        >
          <Icon className="h-5 w-5" /> {label}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto flex max-w-[1500px]">
        {/* desktop sidebar */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto border-r border-slate-200 bg-white lg:block">{sidebar}</aside>

        {/* mobile drawer */}
        {open && (
          <div className="fixed inset-0 z-[55] lg:hidden">
            <div className="absolute inset-0 bg-slate-900/50" onClick={() => setOpen(false)} />
            <aside className="absolute left-0 top-0 h-full w-72 max-w-[85%] overflow-y-auto bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <span className="font-bold text-navy">Menu</span>
                <button onClick={() => setOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></button>
              </div>
              {sidebar}
            </aside>
          </div>
        )}

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:py-8">
          <button onClick={() => setOpen(true)} className="btn-outline mb-4 lg:hidden"><Menu className="h-4 w-4" /> Menu</button>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
