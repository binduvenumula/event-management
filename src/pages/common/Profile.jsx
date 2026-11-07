import { useState } from 'react';
import toast from 'react-hot-toast';
import api, { errMsg } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { BRANCHES } from '../../utils/constants';

// Profile + change password, shared by all roles.
export default function Profile() {
  const { user, refreshUser } = useAuth();
  const isStudent = user.role === 'student';
  const [form, setForm] = useState({ name: user.name || '', phone: user.phone || '', rollNumber: user.rollNumber || '', branch: user.branch || '', year: user.year || '' });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [busy, setBusy] = useState('');

  const saveProfile = async (e) => {
    e.preventDefault();
    if (form.name.trim().length < 2) return toast.error('Enter your name');
    setBusy('profile');
    try {
      await api.put('/auth/profile', isStudent ? { ...form, year: Number(form.year) || undefined } : { name: form.name, phone: form.phone });
      await refreshUser();
      toast.success('Profile updated');
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(''); }
  };

  const savePw = async (e) => {
    e.preventDefault();
    if (pw.newPassword.length < 6) return toast.error('New password must be at least 6 characters');
    if (pw.newPassword !== pw.confirm) return toast.error('Passwords do not match');
    setBusy('pw');
    try {
      await api.put('/auth/change-password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      toast.success('Password changed');
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) { toast.error(errMsg(err)); } finally { setBusy(''); }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-extrabold">My account</h1>

      <form onSubmit={saveProfile} className="card space-y-4 p-5">
        <h2 className="font-bold">Profile</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="pname">Name</label><input id="pname" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="label">Email</label><input className="input" value={user.email} disabled /></div>
          <div><label className="label" htmlFor="pphone">Phone</label><input id="pphone" className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          {isStudent && (
            <>
              <div><label className="label" htmlFor="proll">Roll number</label><input id="proll" className="input" value={form.rollNumber} onChange={(e) => setForm({ ...form, rollNumber: e.target.value })} /></div>
              <div>
                <label className="label" htmlFor="pbranch">Branch</label>
                <select id="pbranch" className="input" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })}>
                  {BRANCHES.map((b) => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="pyear">Year</label>
                <select id="pyear" className="input" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })}>
                  {[1, 2, 3, 4].map((y) => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
            </>
          )}
        </div>
        <button className="btn-primary" disabled={busy === 'profile'}>{busy === 'profile' ? 'Saving...' : 'Save profile'}</button>
      </form>

      <form onSubmit={savePw} className="card space-y-4 p-5">
        <h2 className="font-bold">Change password</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div><label className="label" htmlFor="cur">Current password</label><input id="cur" type="password" autoComplete="current-password" className="input" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></div>
          <div><label className="label" htmlFor="new">New password</label><input id="new" type="password" autoComplete="new-password" className="input" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></div>
          <div><label className="label" htmlFor="conf">Confirm new password</label><input id="conf" type="password" autoComplete="new-password" className="input" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></div>
        </div>
        <button className="btn-primary" disabled={busy === 'pw'}>{busy === 'pw' ? 'Updating...' : 'Update password'}</button>
      </form>
    </div>
  );
}
