import { useEffect, useState } from 'react';
import { Users, ShieldCheck, UserRound, RefreshCcw, Clock3, LogOut, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllUsers, getVisitors } from '../../api/userApi.js';
import { getApiErrorMessage } from '../../api/axios.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
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
    visitors: visitors.length,
  };

  return (
    <div className="min-h-screen bg-slate-100 p-3 sm:p-6">
      <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Admin</p>
            <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => navigate('/admin/users')} className="rounded-xl bg-indigo-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 sm:px-4">Manage users</button>
            <button onClick={refreshDashboard} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 sm:px-4"><RefreshCcw size={15} /> Refresh</button>
            <button onClick={() => { logout(); navigate('/login', { replace: true }); }} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-600 sm:px-4"><LogOut size={15} /> Logout</button>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-4">
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
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 flex items-center justify-between text-slate-500"><span>Visitors</span><Eye size={16} /></div>
            <div className="text-3xl font-bold text-slate-800">{stats.visitors}</div>
          </div>
        </div>

        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="mb-3 text-lg font-semibold text-slate-800">Users</h2>
            {loading ? (
              <div className="text-sm text-slate-500">Loading users…</div>
            ) : users.length === 0 ? (
              <div className="text-sm text-slate-500">No users found.</div>
            ) : (
              <div className="space-y-2">
                {users.slice(0, 5).map((user) => (
                  <div key={user.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                    <div>
                      <div className="font-medium text-slate-800">{user.name}</div>
                      <div className="text-sm text-slate-500">{user.email}</div>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{user.role}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="mb-3 text-lg font-semibold text-slate-800">Visitors</h2>
            {loading ? (
              <div className="text-sm text-slate-500">Loading activity…</div>
            ) : visitors.length === 0 ? (
              <div className="text-sm text-slate-500">No visitor activity yet.</div>
            ) : (
              <div className="space-y-2">
                {visitors.slice(0, 8).map((visitor) => (
                  <div key={visitor.id} className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-medium text-slate-800">{visitor.user_name}</div>
                      <div className="text-sm text-slate-500">{visitor.user_email}</div>
                      <div className="text-xs text-slate-500">IP: {visitor.user_ip || 'unknown'}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
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
    </div>
  );
}
