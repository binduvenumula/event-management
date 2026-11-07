import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Pencil, Plus, Power, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg, unwrap } from '../../api/axios';
import EmptyState from '../../components/EmptyState';
import Spinner from '../../components/Spinner';
import StatusBadge from '../../components/StatusBadge';
import Modal, { ConfirmModal } from '../../components/Modal';
import { CLUB_CATEGORIES } from '../../utils/constants';

const blank = { name: '', category: 'Technical', description: '', contactEmail: '', headName: '', headEmail: '', headPassword: '' };

export default function ManageClubs() {
  const [clubs, setClubs] = useState(null);
  const [q, setQ] = useState('');
  const [form, setForm] = useState(null); // null = closed; { _id? ...fields }
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [confirm, setConfirm] = useState(null); // { type: 'toggle'|'delete', club }
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => api.get('/clubs', { params: { all: true } }).then((r) => setClubs(unwrap(r))).catch((e) => { toast.error(errMsg(e)); setClubs([]); }), []);
  useEffect(() => { load(); }, [load]);

  if (!clubs) return <Spinner />;
  const shown = clubs.filter((c) => !q || `${c.name} ${c.head?.email || ''}`.toLowerCase().includes(q.toLowerCase()));

  const openNew = () => { setForm({ ...blank }); setErrors({}); setShowPw(false); };
  const openEdit = (c) => {
    setForm({ _id: c._id, name: c.name, category: c.category, description: c.description, contactEmail: c.contactEmail || '', headName: c.head?.name || '', headEmail: c.head?.email || '', headPassword: '' });
    setErrors({}); setShowPw(false);
  };
  const set = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setErrors({ ...errors, [k]: '' }); };

  const validate = () => {
    const e = {};
    const isNew = !form._id;
    if (!form.name.trim()) e.name = 'Club name is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (form.contactEmail && !/^\S+@\S+\.\S+$/.test(form.contactEmail)) e.contactEmail = 'Enter a valid email';
    if (!form.headName.trim()) e.headName = 'Head name is required';
    if (!/^\S+@\S+\.\S+$/.test(form.headEmail)) e.headEmail = 'Enter a valid head email';
    if (isNew && form.headPassword.length < 6) e.headPassword = 'Password must be at least 6 characters';
    if (!isNew && form.headPassword && form.headPassword.length < 6) e.headPassword = 'At least 6 characters (or leave blank to keep)';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const save = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    const body = {
      name: form.name, category: form.category, description: form.description, contactEmail: form.contactEmail,
      head: { name: form.headName, email: form.headEmail, ...(form.headPassword ? { password: form.headPassword } : {}) },
    };
    setBusy(true);
    try {
      const res = form._id ? await api.put(`/clubs/${form._id}`, body) : await api.post('/clubs', body);
      toast.success(res.data.message);
      setForm(null);
      load();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const runConfirm = async () => {
    setBusy(true);
    try {
      const { type, club } = confirm;
      const res = type === 'delete' ? await api.delete(`/clubs/${club._id}`) : await api.patch(`/clubs/${club._id}/status`, { isActive: !club.isActive });
      toast.success(res.data.message);
      setConfirm(null);
      load();
    } catch (err) {
      toast.error(errMsg(err));
      setConfirm(null);
    } finally {
      setBusy(false);
    }
  };

  const inp = (k) => `input ${errors[k] ? 'input-error' : ''}`;
  const err = (k) => errors[k] && <p className="field-error">{errors[k]}</p>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Manage clubs</h1>
        <button className="btn-primary" onClick={openNew}><Plus className="h-4 w-4" /> Add club</button>
      </div>
      <input className="input sm:max-w-xs" placeholder="Search clubs or head email..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search clubs" />

      {shown.length === 0 ? <EmptyState icon={Users} title="No clubs found" /> : (
        <div className="card table-wrap">
          <table className="tbl">
            <thead><tr><th>Club</th><th>Category</th><th>Club head login</th><th>Events</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
            <tbody>
              {shown.map((c) => (
                <tr key={c._id}>
                  <td className="min-w-[180px]"><Link to={`/clubs/${c.slug}`} className="font-semibold hover:text-royal">{c.name}</Link><p className="text-xs text-muted">{c.contactEmail}</p></td>
                  <td><span className="chip">{c.category}</span></td>
                  <td><p className="font-medium">{c.head?.name}</p><p className="text-xs text-muted">{c.head?.email}</p></td>
                  <td>{c.eventCount}</td>
                  <td><StatusBadge status={c.isActive ? 'active' : 'inactive'} /></td>
                  <td>
                    <div className="flex justify-end gap-1.5">
                      <button className="btn-outline btn-sm" onClick={() => openEdit(c)} title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                      <button className="btn-outline btn-sm" onClick={() => setConfirm({ type: 'toggle', club: c })} title={c.isActive ? 'Deactivate' : 'Activate'}><Power className="h-3.5 w-3.5" /> {c.isActive ? 'Deactivate' : 'Activate'}</button>
                      <button className="btn-outline btn-sm text-red-600" onClick={() => setConfirm({ type: 'delete', club: c })} title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <Modal
          title={form._id ? 'Edit club' : 'Add club'} onClose={() => setForm(null)}
          footer={<><button className="btn-outline" onClick={() => setForm(null)} disabled={busy}>Cancel</button><button className="btn-primary" form="club-form" disabled={busy}>{busy ? 'Saving...' : form._id ? 'Save changes' : 'Create club'}</button></>}
        >
          <form id="club-form" onSubmit={save} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div><label className="label" htmlFor="cname">Club name *</label><input id="cname" className={inp('name')} value={form.name} onChange={set('name')} />{err('name')}</div>
              <div><label className="label" htmlFor="ccat">Category *</label>
                <select id="ccat" className="input" value={form.category} onChange={set('category')}>{CLUB_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
            </div>
            <div><label className="label" htmlFor="cdesc">Description *</label><textarea id="cdesc" rows={3} className={inp('description')} value={form.description} onChange={set('description')} />{err('description')}</div>
            <div><label className="label" htmlFor="cmail">Contact email</label><input id="cmail" type="email" className={inp('contactEmail')} value={form.contactEmail} onChange={set('contactEmail')} />{err('contactEmail')}</div>

            <fieldset className="space-y-3 rounded-xl border border-sky bg-sky/30 p-4">
              <legend className="px-1 text-sm font-semibold text-navy">Club head login</legend>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div><label className="label" htmlFor="hname">Head name *</label><input id="hname" className={inp('headName')} value={form.headName} onChange={set('headName')} />{err('headName')}</div>
                <div><label className="label" htmlFor="hemail">Login email *</label><input id="hemail" type="email" className={inp('headEmail')} value={form.headEmail} onChange={set('headEmail')} />{err('headEmail')}</div>
              </div>
              <div>
                <label className="label" htmlFor="hpw">{form._id ? 'Reset password (optional)' : 'Password *'}</label>
                <div className="relative">
                  <input id="hpw" type={showPw ? 'text' : 'password'} autoComplete="new-password" className={`${inp('headPassword')} pr-10`} value={form.headPassword} onChange={set('headPassword')} />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500" aria-label="Toggle password">{showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </div>
                {err('headPassword')}
              </div>
            </fieldset>
          </form>
        </Modal>
      )}

      {confirm && (
        <ConfirmModal
          busy={busy} danger={confirm.type === 'delete' || confirm.club.isActive} onClose={() => setConfirm(null)} onConfirm={runConfirm}
          title={confirm.type === 'delete' ? 'Delete club permanently?' : confirm.club.isActive ? 'Deactivate club?' : 'Activate club?'}
          confirmLabel={confirm.type === 'delete' ? 'Delete' : confirm.club.isActive ? 'Deactivate' : 'Activate'}
          message={confirm.type === 'delete'
            ? `"${confirm.club.name}", its head login, all its events, registrations and announcements will be permanently deleted. This cannot be undone.`
            : confirm.club.isActive
              ? `"${confirm.club.name}" will be hidden, its events removed from the feed, and its head will not be able to log in.`
              : `"${confirm.club.name}" and its head login will be restored.`}
        />
      )}
    </div>
  );
}
