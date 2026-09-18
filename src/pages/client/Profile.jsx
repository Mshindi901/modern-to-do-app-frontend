import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, updateUserInfo, updateUserPassword, deleteUser } from '../../api/userApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { getApiErrorMessage } from '../../api/axios.js';

export default function Profile() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [form, setForm] = useState({ name: '', email: '' });
  const [password, setPassword] = useState({ new_password: '', confirm_password: '' });
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    try {
      const response = await getCurrentUser();
      const profile = response?.data?.data || {};
      setForm({
        name: profile.name || '',
        email: profile.email || '',
      });
    } catch (error) {
      console.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      await updateUserInfo(form);
      alert('Profile updated');
    } catch (error) {
      alert(getApiErrorMessage(error));
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (password.new_password !== password.confirm_password) {
      alert('Passwords do not match');
      return;
    }

    try {
      await updateUserPassword(password.new_password);
      setPassword({ new_password: '', confirm_password: '' });
      alert('Password updated');
    } catch (error) {
      alert(getApiErrorMessage(error));
    }
  };

  const handleDeleteAccount = async () => {
    const shouldDelete = window.confirm('Delete your account? This cannot be undone.');
    if (!shouldDelete) return;

    try {
      await deleteUser(user.id);
      logout();
      navigate('/login');
    } catch (error) {
      alert(getApiErrorMessage(error));
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-slate-500">Loading profile…</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Account</p>
            <h1 className="text-3xl font-bold text-slate-800">Profile & settings</h1>
          </div>
          <button onClick={() => navigate('/app')} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">Back to dashboard</button>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <form onSubmit={handleProfileSave} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="mb-4 text-xl font-semibold text-slate-800">Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-slate-600">Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400" required />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-600">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400" required />
              </div>
              <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500">Save changes</button>
            </div>
          </form>

          <form onSubmit={handlePasswordChange} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="mb-4 text-xl font-semibold text-slate-800">Password</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-slate-600">New password</label>
                <input type="password" value={password.new_password} onChange={(e) => setPassword({ ...password, new_password: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400" required />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-600">Confirm password</label>
                <input type="password" value={password.confirm_password} onChange={(e) => setPassword({ ...password, confirm_password: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400" required />
              </div>
              <button type="submit" className="rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-700">Change password</button>
            </div>
          </form>
        </div>

        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <h2 className="mb-2 text-lg font-semibold text-rose-700">Account</h2>
          <div className="flex flex-wrap gap-3">
            <button onClick={handleDeleteAccount} className="rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-medium text-rose-600">Delete account</button>
            <button onClick={() => { logout(); navigate('/login'); }} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700">Logout</button>
          </div>
        </div>
      </div>
    </div>
  );
}
