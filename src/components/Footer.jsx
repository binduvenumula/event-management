import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="mt-16 bg-navy text-blue-100">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <Logo className="h-11 w-11" />
            <p className="text-sm font-bold leading-tight text-white">Vignan's Foundation for Science, Technology &amp; Research</p>
          </div>
          <p className="mt-3 text-sm text-blue-200">One place to discover campus events, join clubs and volunteer.</p>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">Quick links</h3>
          <ul className="space-y-2 text-sm">
            <li><Link className="hover:text-white" to="/events">Browse events</Link></li>
            <li><Link className="hover:text-white" to="/clubs">Student clubs</Link></li>
            <li><Link className="hover:text-white" to="/login">Login</Link></li>
            <li><Link className="hover:text-white" to="/signup">Create an account</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">Contact</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0" /> Vadlamudi, Guntur, Andhra Pradesh</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0" /> events@vfstr.edu</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0" /> +91 00000 00000</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-blue-200">
        &copy; {new Date().getFullYear()} VFSTR. All rights reserved.
      </div>
    </footer>
  );
}
