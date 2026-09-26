import { useEffect, useState } from 'react';
import { Plus, Trash2, FolderKanban, ArrowLeft, CalendarDays, CircleDot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getUserProjects, createProject, deleteProject } from '../../api/projectApi.js';
import { getApiErrorMessage } from '../../api/axios.js';

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6242c7');
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
      setColor('#6242c7');
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
    <div className="min-h-screen bg-[#f8f7ff] px-4 py-5 text-slate-900 sm:px-7 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <button onClick={() => navigate('/app')} className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-violet-800 hover:text-violet-950"><ArrowLeft size={16} /> Personal dashboard</button>
        <div className="mb-8 flex flex-col gap-5 border-b border-violet-100 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#6242c7] text-[#e4ed59]"><FolderKanban size={22} /></div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-violet-700">Your work, in focus</p>
              <h1 className="text-3xl font-semibold text-slate-950">Projects</h1>
              <p className="mt-1 text-sm text-slate-500">Keep related tasks in one place.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start rounded-lg border border-violet-100 bg-white px-3 py-2.5 sm:self-auto"><span className="h-2.5 w-2.5 rounded-full bg-[#e4ed59] ring-2 ring-violet-100" /><span className="text-xl font-semibold text-slate-900">{projects.length}</span><span className="text-sm text-slate-500">active projects</span></div>
        </div>

        <form onSubmit={handleCreate} className="mb-8 grid gap-4 border-b border-violet-100 pb-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div>
            <label htmlFor="project-name" className="mb-2 block text-sm font-medium text-slate-700">Start a project</label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input id="project-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Give your project a name" className="min-w-0 flex-1 rounded-lg border border-violet-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" required />
              <label className="flex items-center gap-2 rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm text-slate-600">Color<input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-8 w-9 cursor-pointer rounded-md border-0 bg-transparent p-0" aria-label="Project color" /></label>
            </div>
          </div>
          <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#6242c7] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#5032ae]"><Plus size={16} /> Create project</button>
        </form>

        <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-900">All projects</h2><span className="text-xs text-slate-500">{projects.length} total</span></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <div className="col-span-full border-y border-violet-100 py-10 text-center text-sm text-slate-500">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="col-span-full border-y border-violet-100 py-12 text-center"><span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><FolderKanban size={20} /></span><p className="font-medium text-slate-800">No projects yet</p><p className="mt-1 text-sm text-slate-500">Create one above to give a set of tasks a home.</p></div>
          ) : (
            projects.map((project) => (
              <article key={project.id} className="group border-b border-violet-100 bg-white px-4 py-4 transition hover:bg-violet-50/50 sm:rounded-lg sm:border sm:border-violet-100 sm:px-5">
                <div className="mb-5 flex items-start gap-3">
                  <span className="mt-1 h-3 w-3 shrink-0 rounded-sm ring-4 ring-[#e4ed59]/50" style={{ backgroundColor: project.color || '#6242c7' }} />
                  <div className="min-w-0 flex-1"><h3 className="break-words font-semibold text-slate-900">{project.name}</h3><p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><CircleDot size={12} /> Project workspace</p></div>
                  <button onClick={() => handleDelete(project.id)} className="rounded-md p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-700" aria-label={`Delete project ${project.name}`} title="Delete project"><Trash2 size={15} /></button>
                </div>
                <div className="flex items-center justify-between border-t border-violet-50 pt-3"><span className="flex items-center gap-1.5 text-xs text-slate-500"><CalendarDays size={13} />{project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'In progress'}</span><button onClick={() => navigate(`/app/projects/${project.id}`)} className="rounded-md bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-800 transition hover:bg-violet-100">Open project</button></div>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
