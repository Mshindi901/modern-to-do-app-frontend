import { useEffect, useState } from 'react';
import { ArrowLeft, Clock3, RefreshCcw, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getVisitors } from '../../api/userApi.js';
import { getApiErrorMessage } from '../../api/axios.js';

export default function AdminVisitors() {
  const navigate = useNavigate();
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadVisitors = async () => {
    try {
      setLoading(true);
      const response = await getVisitors();
      const list = response?.data?.data || [];
      setVisitors(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error(getApiErrorMessage(error));
      setVisitors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVisitors();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 p-3 sm:p-6">
      <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button onClick={() => navigate('/admin')} className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600">
              <ArrowLeft size={15} /> Back to dashboard
            </button>
            <p className="text-sm text-slate-500">Admin</p>
            <h1 className="text-3xl font-bold text-slate-800">Visitors</h1>
            <p className="mt-1 text-sm text-slate-500">Every recorded sign-in activity</p>
          </div>
          <button onClick={loadVisitors} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100">
            <RefreshCcw size={15} /> Refresh
          </button>
        </div>

        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
          <div className="rounded-xl bg-white p-2 text-indigo-600"><Users size={18} /></div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{visitors.length}</div>
            <div className="text-sm text-slate-600">visitor records</div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-190 w-full divide-y divide-slate-200 text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Visitor</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">IP address</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Logged in</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {loading ? (
                <tr><td colSpan="5" className="px-4 py-10 text-center text-sm text-slate-500">Loading visitors…</td></tr>
              ) : visitors.length === 0 ? (
                <tr><td colSpan="5" className="px-4 py-10 text-center text-sm text-slate-500">No visitor activity yet.</td></tr>
              ) : (
                visitors.map((visitor, index) => (
                  <tr key={visitor.id || `${visitor.user_email || visitor.email || 'visitor'}-${visitor.logged_at || visitor.logged_in || index}`} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{visitor.user_name || visitor.name || 'Unknown visitor'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{visitor.user_email || visitor.email || 'No email recorded'}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{visitor.user_ip || 'unknown'}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{visitor.logged_at || visitor.logged_in || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-indigo-700">
                        <Clock3 size={13} /> {visitor.time || '—'}
                      </span>
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
