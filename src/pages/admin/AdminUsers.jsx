import { useEffect, useMemo, useState } from 'react';
import { Search, Trash2, RefreshCcw } from 'lucide-react';
import { deleteUser, findUserByEmail, getAllUsers } from '../../api/userApi.js';
import { getApiErrorMessage } from '../../api/axios.js';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      const response = await getAllUsers();
      setUsers(response?.data?.data || []);
    } catch (error) {
      console.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    if (!search) return users;
    return users.filter((user) => user.email?.toLowerCase().includes(search.toLowerCase()));
  }, [users, search]);

  const handleDelete = async (userId) => {
    const target = users.find((user) => user.id === userId);
    if (!target) return;

    const confirmed = window.confirm(`Delete ${target.name} (${target.email})?`);
    if (!confirmed) return;

    try {
      await deleteUser(userId);
      loadUsers();
    } catch (error) {
      console.error(getApiErrorMessage(error));
    }
  };

  const handleSearch = async () => {
    if (!search.trim()) {
      loadUsers();
      return;
    }

    try {
      const response = await findUserByEmail(search.trim());
      const user = response?.data?.data;
      setUsers(user ? [user] : []);
    } catch (error) {
      console.error(getApiErrorMessage(error));
      setUsers([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-500">Admin</p>
            <h1 className="text-3xl font-bold text-slate-800">Users</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <Search size={15} className="text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-52 border-0 bg-transparent text-sm outline-none" placeholder="Search by email" />
            </div>
            <button onClick={handleSearch} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white">Search</button>
            <button onClick={loadUsers} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700"><RefreshCcw size={15} /> Refresh</button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-sm font-semibold text-slate-600">Name</th>
                <th className="px-4 py-3 text-sm font-semibold text-slate-600">Email</th>
                <th className="px-4 py-3 text-sm font-semibold text-slate-600">Role</th>
                <th className="px-4 py-3 text-sm font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {loading ? (
                <tr><td colSpan="4" className="px-4 py-8 text-center text-slate-500">Loading users…</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan="4" className="px-4 py-8 text-center text-slate-500">No users found.</td></tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3 text-sm text-slate-800">{user.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{user.email}</td>
                    <td className="px-4 py-3 text-sm text-slate-600"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{user.role}</span></td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(user.id)} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-600"><Trash2 size={13} /> Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
