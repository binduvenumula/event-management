import { Link } from 'react-router-dom';
import { CalendarCheck, HeartHandshake, Users } from 'lucide-react';
import Logo from '../../components/Logo';

// Split layout shared by Login and Signup: branded blue panel + form.
export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-navy via-royal to-blue-500 p-10 text-white lg:flex">
        <div className="pointer-events-none absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
        <Link to="/" className="flex items-center gap-3">
          <Logo className="h-12 w-12" />
          <span className="text-sm font-bold leading-tight">Vignan's Foundation for Science,<br />Technology &amp; Research</span>
        </Link>
        <div className="relative">
          <h2 className="text-4xl font-extrabold leading-tight">Every campus event,<br />one place.</h2>
          <ul className="mt-8 space-y-4 text-blue-100">
            <li className="flex items-center gap-3"><CalendarCheck className="h-5 w-5 text-accent" /> Register for events in two clicks</li>
            <li className="flex items-center gap-3"><HeartHandshake className="h-5 w-5 text-accent" /> Volunteer and build your profile</li>
            <li className="flex items-center gap-3"><Users className="h-5 w-5 text-accent" /> Follow your favourite clubs</li>
          </ul>
        </div>
        <p className="relative text-xs text-blue-200">&copy; {new Date().getFullYear()} VFSTR</p>
      </div>

      <div className="flex flex-col justify-center bg-white px-5 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-md">
          <Link to="/" className="mb-6 flex items-center gap-2 lg:hidden"><Logo className="h-9 w-9" /><span className="font-extrabold text-navy">VFSTR Events</span></Link>
          <h1 className="text-2xl font-extrabold">{title}</h1>
          <p className="mb-6 mt-1 text-sm text-muted">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
