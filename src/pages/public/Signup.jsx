import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { errMsg } from '../../api/axios';
import { BRANCHES, dashboardPath } from '../../utils/constants';
import AuthShell from './AuthShell';

const empty = { name: '', email: '', password: '', rollNumber: '', branch: '', year: '', phone: '' };

export default function Signup() {
  const { user, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={dashboardPath(user.role)} replace />;

  const set = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setErrors({ ...errors, [k]: '' }); };

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Enter your full name';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters';
    if (!form.rollNumber.trim()) e.rollNumber = 'Roll number is required';
    if (!form.branch) e.branch = 'Select your branch';
    if (!form.year) e.year = 'Select your year';
    if (!/^[0-9+\-\s]{10,15}$/.test(form.phone)) e.phone = 'Enter a valid phone number';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setBusy(true);
    try {
      // role is never sent - the server always creates a student
      await signup({ ...form, year: Number(form.year) });
      toast.success('Account created. Welcome to VFSTR Events!');
      navigate(location.state?.from || '/student', { replace: true });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const inp = (k) => `input ${errors[k] ? 'input-error' : ''}`;
  const err = (k) => errors[k] && <p className="field-error">{errors[k]}</p>;

  return (
    <AuthShell title="Create your student account" subtitle="Join VFSTR Events to register and volunteer.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label className="label" htmlFor="name">Full name</label>
          <input id="name" className={inp('name')} value={form.name} onChange={set('name')} autoComplete="name" />{err('name')}
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" className={inp('email')} value={form.email} onChange={set('email')} autoComplete="email" />{err('email')}
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <div className="relative">
            <input id="password" type={show ? 'text' : 'password'} className={`${inp('password')} pr-10`} value={form.password} onChange={set('password')} autoComplete="new-password" />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500" aria-label={show ? 'Hide password' : 'Show password'}>
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>{err('password')}
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="rollNumber">Roll number</label>
            <input id="rollNumber" className={inp('rollNumber')} value={form.rollNumber} onChange={set('rollNumber')} />{err('rollNumber')}
          </div>
          <div>
            <label className="label" htmlFor="phone">Phone</label>
            <input id="phone" type="tel" className={inp('phone')} value={form.phone} onChange={set('phone')} autoComplete="tel" />{err('phone')}
          </div>
          <div>
            <label className="label" htmlFor="branch">Branch</label>
            <select id="branch" className={inp('branch')} value={form.branch} onChange={set('branch')}>
              <option value="">Select</option>{BRANCHES.map((b) => <option key={b}>{b}</option>)}
            </select>{err('branch')}
          </div>
          <div>
            <label className="label" htmlFor="year">Year</label>
            <select id="year" className={inp('year')} value={form.year} onChange={set('year')}>
              <option value="">Select</option>{[1, 2, 3, 4].map((y) => <option key={y} value={y}>Year {y}</option>)}
            </select>{err('year')}
          </div>
        </div>
        <button className="btn-primary w-full py-2.5" disabled={busy}><UserPlus className="h-4 w-4" /> {busy ? 'Creating account...' : 'Sign up'}</button>
      </form>
      <p className="mt-4 text-center text-sm text-muted">Already have an account? <Link to="/login" state={location.state} className="font-semibold text-royal">Log in</Link></p>
    </AuthShell>
  );
}
