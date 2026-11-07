import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, LayoutDashboard, LogOut, Menu, User, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dashboardPath } from '../utils/constants';
import Logo from './Logo';
import NotificationBell from './NotificationBell';

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/events', label: 'Events' },
  { to: '/clubs', label: 'Clubs' },
];

export default function Navbar() {
  const { user, logout, loading } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => { setMobileOpen(false); setMenuOpen(false); }, [location.pathname]);
  useEffect(() => {
    const onClick = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenuOpen(false);
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const linkClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-sky text-navy' : 'text-slate-600 hover:bg-slate-100'}`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <Logo className="h-10 w-10 shrink-0" />
          <span className="hidden max-w-[270px] text-[13px] font-bold leading-tight text-navy lg:block">
            Vignan's Foundation for Science, Technology &amp; Research
          </span>
          <span className="text-lg font-extrabold tracking-tight text-navy lg:hidden">VFSTR</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {links.map((l) => <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>{l.label}</NavLink>)}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          {user ? (
            <>
              <NotificationBell />
              <div className="relative" ref={menuRef}>
                <button onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100" aria-haspopup="menu" aria-expanded={menuOpen}>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-royal text-sm font-bold text-white">{user.name?.[0]?.toUpperCase()}</span>
                  <span className="hidden max-w-[110px] truncate text-sm font-medium sm:block">{user.name}</span>
                  <ChevronDown className="hidden h-4 w-4 text-slate-500 sm:block" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl bg-white py-1 shadow-2xl ring-1 ring-slate-200" role="menu">
                    <div className="border-b border-slate-100 px-4 py-2">
                      <p className="truncate text-sm font-semibold">{user.name}</p>
                      <p className="truncate text-xs capitalize text-muted">{user.role === 'club' ? `${user.club?.name || 'Club'} head` : user.role}</p>
                    </div>
                    <Link to={dashboardPath(user.role)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50"><LayoutDashboard className="h-4 w-4" /> Dashboard</Link>
                    <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50"><User className="h-4 w-4" /> My profile</Link>
                    <button onClick={() => logout()} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"><LogOut className="h-4 w-4" /> Logout</button>
                  </div>
                )}
              </div>
            </>
          ) : loading ? null : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link to="/login" className="btn-outline">Login</Link>
              <Link to="/signup" className="btn-primary">Sign up</Link>
            </div>
          )}
          <button className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="border-t border-slate-100 bg-white px-4 py-3 md:hidden" aria-label="Mobile">
          <div className="flex flex-col gap-1">
            {links.map((l) => <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>{l.label}</NavLink>)}
            {!user && !loading && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link to="/login" className="btn-outline">Login</Link>
                <Link to="/signup" className="btn-primary">Sign up</Link>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
