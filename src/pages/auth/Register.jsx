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
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
            <UserRound size={24} />
          </div>
          <h1 className="text-3xl font-bold text-slate-800">Create account</h1>
          <p className="mt-2 text-sm text-slate-500">Start planning your work</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm text-slate-600">Name</label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-indigo-400">
              <UserRound size={16} className="text-slate-400" />
              <input name="name" value={form.name} onChange={handleChange} className="w-full border-0 bg-transparent py-3 text-sm outline-none" placeholder="John Doe" required />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-600">Email</label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-indigo-400">
              <Mail size={16} className="text-slate-400" />
              <input name="email" type="email" value={form.email} onChange={handleChange} className="w-full border-0 bg-transparent py-3 text-sm outline-none" placeholder="name@email.com" required />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-600">Password</label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 focus-within:border-indigo-400">
              <Lock size={16} className="text-slate-400" />
              <input name="password" type="password" value={form.password} onChange={handleChange} className="w-full border-0 bg-transparent py-3 text-sm outline-none" placeholder="••••••••" required />
            </div>
          </div>

          {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</div>}

          <button type="submit" disabled={loading} className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
