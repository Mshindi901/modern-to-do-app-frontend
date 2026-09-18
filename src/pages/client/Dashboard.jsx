import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, ListTodo, Star, Plus, Search, Inbox, Bell, Filter, Settings, FolderKanban, Tag, LogOut, ChevronRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getUserTasks, toggleTaskComplete, toggleTaskStar, createTask, getCompletedTasks, getStarredTasks } from '../../api/taskApi.js';
import { getUserProjects as getProjects, createProject } from '../../api/projectApi.js';
import { createTag } from '../../api/tagApi.js';
import { getCurrentUser } from '../../api/userApi.js';
import { getApiErrorMessage } from '../../api/axios.js';
import Button from '../../components/ui/Button.jsx';

const priorityMeta = {
  low: { label: 'No rush', className: 'bg-emerald-100 text-emerald-700' },
  medium: { label: 'Important', className: 'bg-amber-100 text-amber-700' },
  high: { label: 'Urgent', className: 'bg-rose-100 text-rose-700' },
};

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: '', color: '#6366f1' });
  const [tagForm, setTagForm] = useState({ name: '', color: '#8b5cf6' });
  const [pendingTask, setPendingTask] = useState({ title: '', context: '', priority: 'low', due_date: '', project_id: '', is_completed: false, is_starred: false });

  const currentView = useMemo(() => {
    const path = location.pathname;
    if (path.includes('/today')) return 'today';
    if (path.includes('/upcoming')) return 'upcoming';
    if (path.includes('/completed')) return 'completed';
    if (path.includes('/starred')) return 'starred';
    if (path.includes('/tasks')) return 'inbox';
    return 'inbox';
  }, [location.pathname]);

  const viewTitle = {
    inbox: 'Inbox',
    today: 'Today',
    upcoming: 'Upcoming',
    completed: 'Completed',
    starred: 'Starred',
  }[currentView] || 'Inbox';

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [projectResp, userResp] = await Promise.all([
        getProjects().catch(() => ({ data: { data: [] } })),
        getCurrentUser().catch(() => ({ data: { data: {} } })),
      ]);

      const projectData = projectResp?.data?.data || [];
      const profile = userResp?.data?.data || {};

      setProjects(Array.isArray(projectData) ? projectData : []);
      setCurrentUser(profile || {});

      if (currentView === 'completed') {
        const response = await getCompletedTasks().catch(() => ({ data: { data: [] } }));
        const data = response?.data?.data || [];
        setTasks(Array.isArray(data) ? data : []);
      } else if (currentView === 'starred') {
        const response = await getStarredTasks().catch(() => ({ data: { data: [] } }));
        const data = response?.data?.data || [];
        setTasks(Array.isArray(data) ? data : []);
      } else {
        const response = await getUserTasks().catch(() => ({ data: { data: [] } }));
        const data = response?.data?.data || [];
        setTasks(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentView]);

  const visibleTasks = useMemo(() => {
    let records = [...tasks];

    if (currentView === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      records = records.filter((task) => {
        if (!task.due_date) return false;
        const due = new Date(task.due_date);
        return due >= today && due < new Date(today.getTime() + 24 * 60 * 60 * 1000);
      });
    }

    if (currentView === 'upcoming') {
      records = records.filter((task) => task.due_date);
      records.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    }

    if (currentView === 'completed') {
      records = records.filter((task) => task.is_completed);
    }

    if (currentView === 'starred') {
      records = records.filter((task) => task.is_starred);
    }

    if (currentView === 'inbox') {
      records = records.filter((task) => task.title || task.context);
    }

    return records.filter((task) => {
      const text = `${task.title || ''} ${task.context || ''}`.toLowerCase();
      return !search || text.includes(search.toLowerCase());
    });
  }, [tasks, currentView, search]);

  const summary = useMemo(() => ({
    total: tasks.length,
    completed: tasks.filter((task) => task.is_completed).length,
    pending: tasks.filter((task) => !task.is_completed).length,
    starred: tasks.filter((task) => task.is_starred).length,
  }), [tasks]);

  const handleTaskToggle = async (taskId, value) => {
    try {
      setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, is_completed: value } : task)));
      await toggleTaskComplete(taskId, value);
    } catch (error) {
      console.error(getApiErrorMessage(error));
      fetchDashboardData();
    }
  };

  const handleStarToggle = async (taskId, value) => {
    try {
      setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, is_starred: value } : task)));
      await toggleTaskStar(taskId, value);
    } catch (error) {
      console.error(getApiErrorMessage(error));
      fetchDashboardData();
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      await createTask({
        ...pendingTask,
        project_id: pendingTask.project_id || null,
        due_date: pendingTask.due_date || null,
      });
      setIsAddOpen(false);
      setPendingTask({ title: '', context: '', priority: 'low', due_date: '', project_id: '', is_completed: false, is_starred: false });
      fetchDashboardData();
    } catch (error) {
      console.error(getApiErrorMessage(error));
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await createProject({ name: projectForm.name, color: projectForm.color });
      setProjectForm({ name: '', color: '#6366f1' });
      setIsProjectModalOpen(false);
      fetchDashboardData();
    } catch (error) {
      console.error(getApiErrorMessage(error));
    }
  };

  const handleCreateTag = async (e) => {
    e.preventDefault();
    try {
      await createTag({ name: tagForm.name, color: tagForm.color });
      setTagForm({ name: '', color: '#8b5cf6' });
      setIsTagModalOpen(false);
    } catch (error) {
      console.error(getApiErrorMessage(error));
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-100"><div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-500" /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-violet-50 text-slate-800">
      <div className="mx-auto flex max-w-[1600px] gap-5 p-4 lg:p-6">
        <aside className="hidden w-72 shrink-0 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur-sm lg:flex lg:flex-col">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 text-lg font-bold text-white shadow-sm shadow-violet-200">T</div>
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-800">The lazy</h2>
              </div>
            </div>
          </div>

          <div className="mb-5 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <Search size={15} className="text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Search" />
          </div>

          <nav className="space-y-1 text-sm">
            {[
              { label: 'Inbox', icon: Inbox, path: '/app' },
              { label: 'Today', icon: CalendarDays, path: '/app/today' },
              { label: 'Upcoming', icon: ListTodo, path: '/app/upcoming' },
              { label: 'Completed', icon: CheckCircle2, path: '/app/completed' },
              { label: 'Starred', icon: Star, path: '/app/starred' },
            ].map(({ label, icon: Icon, path }) => (
              <button key={label} onClick={() => navigate(path)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition ${currentView === (path === '/app' ? 'inbox' : path.replace('/app/', '')) ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}>
                <Icon size={16} />
                {label}
              </button>
            ))}
          </nav>

          <div className="mt-7">
            <div className="mb-3 flex items-center justify-between px-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Projects</span>
              <button onClick={() => setIsProjectModalOpen(true)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"><Plus size={16} /></button>
            </div>
            <div className="space-y-1">
              {projects.slice(0, 5).map((project) => (
                <button key={project.id} onClick={() => navigate(`/app/projects/${project.id}`)} className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-slate-600 hover:bg-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: project.color || '#818cf8' }} />
                    {project.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-7">
            <div className="mb-3 flex items-center justify-between px-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Tags</span>
              <button onClick={() => setIsTagModalOpen(true)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"><Plus size={16} /></button>
            </div>
          </div>

          <div className="mt-auto space-y-2 border-t border-slate-200 pt-4">
            <button onClick={() => navigate('/app/profile')} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-slate-600 hover:bg-slate-100">
              <Settings size={16} /> Settings
            </button>
            <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-slate-600 hover:bg-slate-100">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </aside>

        <main className="flex-1 rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm sm:p-6">
          <div className="mb-6 flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-slate-500">Good morning</p>
              <h1 className="text-3xl font-bold text-slate-800">{currentUser?.name || user?.name || 'Welcome'}</h1>
            </div>

            <div className="flex items-center gap-3">
              <button className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-600 hover:bg-slate-100"><Bell size={18} /></button>
              <Button onClick={() => setIsAddOpen(true)} className="gap-2 rounded-xl">
                <Plus size={16} /> Add task
              </Button>
            </div>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Total tasks', value: summary.total, icon: ListTodo },
              { label: 'Completed', value: summary.completed, icon: CheckCircle2 },
              { label: 'Pending', value: summary.pending, icon: CalendarDays },
              { label: 'Starred', value: summary.starred, icon: Star },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-sm shadow-slate-200/40">
                <div className="mb-2 flex items-center justify-between text-slate-500">
                  <span className="text-sm">{label}</span>
                  <Icon size={16} />
                </div>
                <div className="text-2xl font-bold text-slate-800">{value}</div>
              </div>
            ))}
          </div>

          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">{viewTitle}</h2>
              <p className="text-sm text-slate-500">{visibleTasks.length} tasks</p>
            </div>
            <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600"><Filter size={14} /> Filter</button>
          </div>

          <div className="space-y-3">
            {visibleTasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500">You don't have any tasks yet.</div>
            ) : (
              visibleTasks.map((task) => (
                <div key={task.id} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition ${selectedTask?.id === task.id ? 'border-indigo-200 bg-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`} onClick={() => setSelectedTask(task)}>
                  <input type="checkbox" checked={Boolean(task.is_completed)} onChange={(e) => { e.stopPropagation(); handleTaskToggle(task.id, e.target.checked); }} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`truncate font-medium ${task.is_completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.title}</span>
                      {task.project_id && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">{projects.find((project) => project.id === task.project_id)?.name || 'Project'}</span>}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}</span>
                      <span className={`rounded-full px-2 py-0.5 font-medium ${priorityMeta[task.priority]?.className || 'bg-slate-100 text-slate-600'}`}>
                        {priorityMeta[task.priority]?.label || task.priority}
                      </span>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleStarToggle(task.id, !task.is_starred); }} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-yellow-500">
                    <Star size={16} className={task.is_starred ? 'fill-yellow-400 text-yellow-400' : ''} />
                  </button>
                </div>
              ))
            )}
          </div>
        </main>

        <aside className="hidden w-[380px] shrink-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm xl:block">
          {selectedTask ? (
            <div>
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-800">{selectedTask.title}</h3>
                <button onClick={() => handleStarToggle(selectedTask.id, !selectedTask.is_starred)} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-yellow-500">
                  <Star size={18} className={selectedTask.is_starred ? 'fill-yellow-400 text-yellow-400' : ''} />
                </button>
              </div>

              <div className="space-y-4 text-sm text-slate-600">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                  <span>Completed</span>
                  <input type="checkbox" checked={Boolean(selectedTask.is_completed)} onChange={(e) => handleTaskToggle(selectedTask.id, e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                </div>
                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
                  <span>Priority</span>
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${priorityMeta[selectedTask.priority]?.className || 'bg-slate-100 text-slate-600'}`}>
                    {priorityMeta[selectedTask.priority]?.label || selectedTask.priority}
                  </span>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">Due date</div>
                  {selectedTask.due_date ? new Date(selectedTask.due_date).toLocaleDateString() : 'No due date'}
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">Project</div>
                  {projects.find((project) => project.id === selectedTask.project_id)?.name || 'No project'}
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="mb-1 text-xs uppercase tracking-wide text-slate-400">Description</div>
                  <p>{selectedTask.context || 'No description provided.'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-slate-500">Select a task to view details</div>
          )}
        </aside>
      </div>

      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-semibold">Add project</h3>
              <button type="button" onClick={() => setIsProjectModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-slate-600">Name</label>
                <input value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-indigo-400" required />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-600">Color</label>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <input type="color" value={projectForm.color} onChange={(e) => setProjectForm({ ...projectForm, color: e.target.value })} className="h-10 w-14 rounded-lg border-0 bg-transparent p-0" />
                  <span className="text-sm text-slate-600">{projectForm.color}</span>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsProjectModalOpen(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600">Cancel</button>
                <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">Create project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isTagModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-semibold">Add tag</h3>
              <button type="button" onClick={() => setIsTagModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleCreateTag} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-slate-600">Tag name</label>
                <input value={tagForm.name} onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-violet-400" required />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-600">Color</label>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <input type="color" value={tagForm.color} onChange={(e) => setTagForm({ ...tagForm, color: e.target.value })} className="h-10 w-14 rounded-lg border-0 bg-transparent p-0" />
                  <span className="text-sm text-slate-600">{tagForm.color}</span>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsTagModalOpen(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600">Cancel</button>
                <button type="submit" className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500">Create tag</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-xl font-semibold">Add task</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-slate-600">Title</label>
                <input value={pendingTask.title} onChange={(e) => setPendingTask({ ...pendingTask, title: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-indigo-400" required />
              </div>
              <div>
                <label className="mb-1 block text-sm text-slate-600">Description</label>
                <textarea value={pendingTask.context} onChange={(e) => setPendingTask({ ...pendingTask, context: e.target.value })} className="min-h-24 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-indigo-400" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm text-slate-600">Priority</label>
                  <select value={pendingTask.priority} onChange={(e) => setPendingTask({ ...pendingTask, priority: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-indigo-400">
                    <option value="low">No rush</option>
                    <option value="medium">Important</option>
                    <option value="high">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-slate-600">Due date</label>
                  <input type="date" value={pendingTask.due_date} onChange={(e) => setPendingTask({ ...pendingTask, due_date: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-indigo-400" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-600">Project</label>
                <select value={pendingTask.project_id} onChange={(e) => setPendingTask({ ...pendingTask, project_id: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 outline-none focus:border-indigo-400">
                  <option value="">No project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                <span className="text-sm text-slate-600">Starred</span>
                <input type="checkbox" checked={pendingTask.is_starred} onChange={(e) => setPendingTask({ ...pendingTask, is_starred: e.target.checked })} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsAddOpen(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600">Cancel</button>
                <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">Create task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
