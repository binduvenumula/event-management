import { useEffect, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { errMsg, unwrap } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import PosterImage from '../../components/PosterImage';
import Spinner from '../../components/Spinner';

// Club head edits the public club page: description, logo, banner, contact and socials.
export default function ClubProfile() {
  const { user, refreshUser } = useAuth();
  const [club, setClub] = useState(null);
  const [form, setForm] = useState({ description: '', contactEmail: '', instagram: '', linkedin: '' });
  const [files, setFiles] = useState({ logo: null, banner: null });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get(`/clubs/${user.club._id}`).then((r) => {
      const c = unwrap(r);
      setClub(c);
      setForm({ description: c.description, contactEmail: c.contactEmail || '', instagram: c.socialLinks?.instagram || '', linkedin: c.socialLinks?.linkedin || '' });
    }).catch((e) => toast.error(errMsg(e)));
  }, [user.club._id]);

  const pick = (k) => (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) return toast.error('Only jpg, png or webp images are allowed');
    if (f.size > 2 * 1024 * 1024) return toast.error('Image must be 2 MB or smaller');
    setFiles({ ...files, [k]: f });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.description.trim()) return toast.error('Description is required');
    if (form.contactEmail && !/^\S+@\S+\.\S+$/.test(form.contactEmail)) return toast.error('Enter a valid contact email');
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (files.logo) fd.append('logo', files.logo);
    if (files.banner) fd.append('banner', files.banner);
    setBusy(true);
    try {
      const res = await api.put('/clubs/my/profile', fd);
      setClub(unwrap(res));
      setFiles({ logo: null, banner: null });
      await refreshUser();
      toast.success(res.data.message);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  if (!club) return <Spinner />;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const bannerPreview = files.banner ? URL.createObjectURL(files.banner) : club.banner;
  const logoPreview = files.logo ? URL.createObjectURL(files.logo) : club.logo;

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-extrabold">{club.name} - profile</h1>
      <section className="card space-y-4 p-5">
        <h2 className="font-bold">Images</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_160px]">
          <div>
            <PosterImage src={bannerPreview} title={club.name} className="h-32 w-full rounded-lg" />
            <label className="btn-outline btn-sm mt-2 cursor-pointer"><ImagePlus className="h-4 w-4" /> {files.banner ? files.banner.name : 'Change banner'}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={pick('banner')} /></label>
          </div>
          <div>
            <PosterImage src={logoPreview} title={club.name} className="h-32 w-full rounded-lg" />
            <label className="btn-outline btn-sm mt-2 cursor-pointer"><ImagePlus className="h-4 w-4" /> {files.logo ? 'Selected' : 'Change logo'}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={pick('logo')} /></label>
          </div>
        </div>
        <p className="text-xs text-muted">jpg, png or webp, up to 2 MB each.</p>
      </section>

      <section className="card space-y-4 p-5">
        <h2 className="font-bold">About</h2>
        <div><label className="label" htmlFor="desc">Description</label><textarea id="desc" rows={5} maxLength={2000} className="input" value={form.description} onChange={set('description')} /></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="ce">Contact email</label><input id="ce" type="email" className="input" value={form.contactEmail} onChange={set('contactEmail')} /></div>
          <div><label className="label" htmlFor="ig">Instagram URL</label><input id="ig" className="input" placeholder="https://instagram.com/..." value={form.instagram} onChange={set('instagram')} /></div>
          <div><label className="label" htmlFor="li">LinkedIn URL</label><input id="li" className="input" placeholder="https://linkedin.com/..." value={form.linkedin} onChange={set('linkedin')} /></div>
        </div>
      </section>
      <div className="flex justify-end"><button className="btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Save profile'}</button></div>
    </form>
  );
}
