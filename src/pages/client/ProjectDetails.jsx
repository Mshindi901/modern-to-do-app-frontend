import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProjectTasks } from '../../api/taskApi.js';
import { getUserProjects } from '../../api/projectApi.js';
import { getApiErrorMessage } from '../../api/axios.js';

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [projectsRes, tasksRes] = await Promise.all([
          getUserProjects().catch(() => ({ data: { data: [] } })),
          getProjectTasks(id).catch(() => ({ data: { data: [] } })),
        ]);

        const projects = projectsRes?.data?.data || [];
        const found = projects.find((item) => item.id === id);
        setProject(found || null);
        setTasks(tasksRes?.data?.data || []);
      } catch (error) {
        console.error(getApiErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-slate-500">Loading project…</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Project</p>
            <h1 className="text-3xl font-bold text-slate-800">{project?.name || 'Project details'}</h1>
          </div>
          <button onClick={() => navigate('/app/projects')} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">Back to projects</button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Project info</p>
            <p className="mt-2 text-slate-700">{project ? `Name: ${project.name}` : 'Project not found'}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Tasks</p>
            <p className="mt-2 text-2xl font-bold text-slate-800">{tasks.length}</p>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="mb-3 text-xl font-semibold text-slate-800">Tasks in project</h2>
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">No tasks in this project yet.</div>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800">{task.title}</h3>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{task.priority || 'low'}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{task.context || 'No description'}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
