import { useEffect, useState } from 'react';
import { Users, ShieldCheck, UserRound, RefreshCcw, Clock3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllUsers, getVisitors } from '../../api/userApi.js';
import { getApiErrorMessage } from '../../api/axios.js';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      const response = await getAllUsers();
      const list = response?.data?.data || [];
      setUsers(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error(getApiErrorMessage(error));
    }
  };

  const loadVisitors = async () => {
    try {
      const response = await getVisitors();
      const list = response?.data?.data || [];
      setVisitors(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const refreshDashboard = async () => {
    setLoading(true);
    await Promise.all([loadUsers(), loadVisitors()]);
  };

  useEffect(() => {
    refreshDashboard();
  }, []);

  const stats = {
    total: users.length,
    admin: users.filter((user) => user.role === 'admin').length,
    user: users.filter((user) => user.role === 'user').length,
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Admin</p>
            <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/admin/users')} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500">Manage users</button>
            <button onClick={refreshDashboard} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700"><RefreshCcw size={15} /> Refresh</button>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 flex items-center justify-between text-slate-500"><span>Total users</span><Users size={16} /></div>
            <div className="text-3xl font-bold text-slate-800">{stats.total}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 flex items-center justify-between text-slate-500"><span>Admins</span><ShieldCheck size={16} /></div>
            <div className="text-3xl font-bold text-slate-800">{stats.admin}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 flex items-center justify-between text-slate-500"><span>Normal users</span><UserRound size={16} /></div>
            <div className="text-3xl font-bold text-slate-800">{stats.user}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <h2 className="mb-3 text-lg font-semibold text-slate-800">Recent logins</h2>
          {loading ? (
            <div className="text-sm text-slate-500">Loading activity…</div>
          ) : visitors.length === 0 ? (
            <div className="text-sm text-slate-500">No visitor activity yet.</div>
          ) : (
            <div className="space-y-2">
              {visitors.slice(0, 8).map((visitor) => (
                <div key={visitor.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
                  <div>
                    <div className="font-medium text-slate-800">{visitor.user_name}</div>
                    <div className="text-sm text-slate-500">{visitor.user_email}</div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{visitor.logged_at || visitor.logged_in || '—'}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-1 text-indigo-600">
                      <Clock3 size={12} /> {visitor.time || '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
