import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Info, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { errMsg } from '../../api/axios';
import { dashboardPath } from '../../utils/constants';
import AuthShell from './AuthShell';

const DEMO = [
  { role: 'President', email: 'president@vfstr.edu', pw: 'President@123' },
  { role: 'Club head', email: 'coding-club@vfstr.edu', pw: 'Club@123' },
  { role: 'Student', email: 'student1@vfstr.edu', pw: 'Student@123' },
];

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={location.state?.from || dashboardPath(user.role)} replace />;

  const set = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setErrors({ ...errors, [k]: '' }); };

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) er.email = 'Enter a valid email address';
    if (!form.password) er.password = 'Password is required';
    setErrors(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      const u = await login(form.email.trim(), form.password);
      toast.success(`Welcome back, ${u.name.split(' ')[0]}!`);
      // students go back to where they were; staff go to their dashboard
      navigate(location.state?.from && u.role === 'student' ? location.state.from : dashboardPath(u.role), { replace: true });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in to register for events and manage your activity.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" className={`input ${errors.email ? 'input-error' : ''}`} value={form.email} onChange={set('email')} placeholder="you@vfstr.edu" />
          {errors.email && <p className="field-error">{errors.email}</p>}
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <div className="relative">
            <input id="password" type={show ? 'text' : 'password'} autoComplete="current-password" className={`input pr-10 ${errors.password ? 'input-error' : ''}`} value={form.password} onChange={set('password')} />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500" aria-label={show ? 'Hide password' : 'Show password'}>
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="field-error">{errors.password}</p>}
        </div>
        <button className="btn-primary w-full py-2.5" disabled={busy}><LogIn className="h-4 w-4" /> {busy ? 'Logging in...' : 'Log in'}</button>
      </form>

      <p className="mt-4 text-center text-sm text-muted">New student? <Link to="/signup" state={location.state} className="font-semibold text-royal">Create an account</Link></p>

      <div className="mt-6 rounded-xl border border-sky bg-sky/40 p-4">
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-navy"><Info className="h-4 w-4" /> Demo credentials</p>
        <ul className="space-y-1.5 text-xs">
          {DEMO.map((d) => (
            <li key={d.email} className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate"><b>{d.role}:</b> {d.email}</span>
              <button type="button" className="shrink-0 font-semibold text-royal hover:underline" onClick={() => { setForm({ email: d.email, password: d.pw }); setErrors({}); }}>Use</button>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] text-muted">Passwords: President@123 · Club@123 · Student@123</p>
      </div>
    </AuthShell>
  );
}
