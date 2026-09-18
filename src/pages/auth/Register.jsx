import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { UserRound, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getApiErrorMessage } from '../../api/axios.js';

export default function Register() {
  const { register, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === 'admin' ? '/admin' : '/app', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await register(form);
      navigate('/login');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-violet-50 to-slate-100 p-4">
      <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white/95 p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-lg shadow-violet-200/70">
            <UserRound size={24} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">Create account</h1>
          <p className="mt-2 text-sm text-slate-500">Start planning your work</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">Name</label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 transition focus-within:border-violet-400 focus-within:bg-white">
              <UserRound size={16} className="text-slate-400" />
              <input name="name" value={form.name} onChange={handleChange} className="w-full border-0 bg-transparent py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400" placeholder="John Doe" required />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">Email</label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 transition focus-within:border-violet-400 focus-within:bg-white">
              <Mail size={16} className="text-slate-400" />
              <input name="email" type="email" value={form.email} onChange={handleChange} className="w-full border-0 bg-transparent py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400" placeholder="name@email.com" required />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">Password</label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 transition focus-within:border-violet-400 focus-within:bg-white">
              <Lock size={16} className="text-slate-400" />
              <input name="password" type="password" value={form.password} onChange={handleChange} className="w-full border-0 bg-transparent py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400" placeholder="••••••••" required />
            </div>
          </div>

          {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</div>}

          <button type="submit" disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-violet-200 transition hover:from-violet-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-violet-600 hover:text-violet-500">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
