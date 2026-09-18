import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, FolderKanban } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUserProjects, createProject, deleteProject } from '../../api/projectApi.js';
import { getApiErrorMessage } from '../../api/axios.js';

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [loading, setLoading] = useState(true);

  const loadProjects = async () => {
    try {
      const response = await getUserProjects();
      const data = response?.data?.data || [];
      setProjects(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createProject({ name, color });
      setName('');
      setColor('#6366f1');
      loadProjects();
    } catch (error) {
      console.error(getApiErrorMessage(error));
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteProject(id);
      loadProjects();
    } catch (error) {
      console.error(getApiErrorMessage(error));
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-6xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-indigo-100 p-2 text-indigo-700"><FolderKanban size={20} /></div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Projects</h1>
              <p className="text-sm text-slate-500">Manage your workspaces</p>
            </div>
          </div>
          <button onClick={() => navigate('/app')} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">Back to dashboard</button>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-[1.5fr_1fr]">
          <form onSubmit={handleCreate} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="mb-3 text-lg font-semibold text-slate-800">Create project</h2>
            <div className="space-y-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400" required />
              <div className="flex items-center gap-3">
                <label className="text-sm text-slate-600">Color</label>
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-10 w-14 rounded-lg border-0 bg-transparent p-0" />
              </div>
              <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500"><Plus size={16} /> Add project</button>
            </div>
          </form>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="mb-2 text-lg font-semibold text-slate-800">Summary</h2>
            <p className="text-3xl font-bold text-slate-800">{projects.length}</p>
            <p className="text-sm text-slate-500">Active projects</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">Loading projects…</div>
          ) : projects.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">No projects found.</div>
          ) : (
            projects.map((project) => (
              <div key={project.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: project.color || '#6366f1' }} />
                    <h3 className="font-semibold text-slate-800">{project.name}</h3>
                  </div>
                </div>
                <p className="mb-4 text-sm text-slate-500">{project.id}</p>
                <div className="flex justify-end gap-2">
                  <button onClick={() => navigate(`/app/projects/${project.id}`)} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"><Pencil size={14} /> Open</button>
                  <button onClick={() => handleDelete(project.id)} className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600"><Trash2 size={14} /> Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
