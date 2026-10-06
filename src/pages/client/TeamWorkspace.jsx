import { useEffect, useState } from 'react';
import { AtSign, CalendarDays, CheckSquare2, CircleDot, FileText, FolderKanban, ListTodo, Plus, Tags } from 'lucide-react';
import { createNote } from '../../api/noteApi.js';
import { createPlan } from '../../api/planApi.js';
import { createProject } from '../../api/projectApi.js';
import { createSubtask } from '../../api/subTaskApi.js';
import { createTag } from '../../api/tagApi.js';
import { createTask, toggleTaskComplete } from '../../api/taskApi.js';
import { getApiErrorMessage } from '../../api/axios.js';
import { addTaskAssignee, getTaskAssignees, getTeamWorkspace, removeTaskAssignee } from '../../api/teamWorkspaceApi.js';

const resources = [
  { key: 'tasks', label: 'Tasks', Icon: CheckSquare2 },
  { key: 'projects', label: 'Projects', Icon: FolderKanban },
  { key: 'tags', label: 'Tags', Icon: Tags },
  { key: 'subtasks', label: 'Sub-tasks', Icon: ListTodo },
  { key: 'notes', label: 'Notes', Icon: FileText },
  { key: 'plans', label: 'Plans', Icon: CalendarDays },
];

const emptyForm = {
  name: '',
  title: '',
  context: '',
  description: '',
  color: '#6242c7',
  priority: 'low',
  due_date: '',
  project_id: '',
  task_id: '',
  date: '',
  start_at: '',
  end_at: '',
};

function getDateKey(value) {
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return value ? String(value).slice(0, 10) : '';
}

function getCurrentWeekDays() {
  const today = new Date();
  const monday = new Date(today);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date;
  });
}

function getRecordTitle(resource, record) {
  if (resource === 'projects' || resource === 'tags') return record.name || 'Untitled';
  return record.title || 'Untitled';
}

function getRecordDescription(resource, record) {
  if (resource === 'tasks') return record.context || `Priority: ${record.priority || 'low'}`;
  if (resource === 'projects') return `Project · ${record.createdAt ? new Date(record.createdAt).toLocaleDateString() : 'In progress'}`;
  if (resource === 'tags') return 'Workspace tag';
  if (resource === 'subtasks') return record.is_completed ? 'Completed sub-task' : 'Sub-task';
  if (resource === 'notes') return record.context || 'Note';
  if (resource === 'plans') return [record.description, record.date, record.start_at && record.end_at ? `${record.start_at}–${record.end_at}` : ''].filter(Boolean).join(' · ') || 'Plan';
  return '';
}

function isLightColor(color) {
  const match = /^#([0-9a-f]{6})$/i.exec(color || '');
  if (!match) return false;
  const value = Number.parseInt(match[1], 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return (red * 299 + green * 587 + blue * 114) / 1000 > 150;
}

async function fetchTaskAssigneeMap(tasks) {
  const entries = await Promise.all(tasks.map(async (task) => {
    const response = await getTaskAssignees(task.id);
    const assignees = response?.data?.data;
    return [String(task.id), Array.isArray(assignees) ? assignees : []];
  }));
  return Object.fromEntries(entries);
}

export default function TeamWorkspace({ team, members = [], onNotice }) {
  const [resource, setResource] = useState('tasks');
  const [workspace, setWorkspace] = useState({ projects: [], tasks: [], tags: [], subtasks: [], notes: [], plans: [] });
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [taskAssignees, setTaskAssignees] = useState({});
  const [mentionTaskId, setMentionTaskId] = useState(null);
  const [updatingMention, setUpdatingMention] = useState(false);

  const loadWorkspace = async () => {
    setLoading(true);
    try {
      const data = await getTeamWorkspace(team.id);
      setWorkspace(data);
      try {
        setTaskAssignees(await fetchTaskAssigneeMap(data.tasks));
      } catch (error) {
        onNotice({ type: 'error', message: getApiErrorMessage(error) });
      }
    } catch (error) {
      onNotice({ type: 'error', message: getApiErrorMessage(error) });
      setWorkspace({ projects: [], tasks: [], tags: [], subtasks: [], notes: [], plans: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    getTeamWorkspace(team.id)
      .then(async (data) => {
        if (!active) return;
        setWorkspace(data);
        try {
          const assignees = await fetchTaskAssigneeMap(data.tasks);
          if (active) setTaskAssignees(assignees);
        } catch (error) {
          if (active) onNotice({ type: 'error', message: getApiErrorMessage(error) });
        }
      })
      .catch((error) => {
        if (!active) return;
        onNotice({ type: 'error', message: getApiErrorMessage(error) });
        setWorkspace({ projects: [], tasks: [], tags: [], subtasks: [], notes: [], plans: [] });
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [team.id, onNotice]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (resource === 'projects') {
        await createProject({ name: form.name.trim(), color: form.color, team_id: team.id });
      } else if (resource === 'tasks') {
        await createTask({
          title: form.title.trim(),
          context: form.context,
          priority: form.priority,
          due_date: form.due_date || null,
          project_id: form.project_id || null,
          team_id: team.id,
          is_completed: false,
          is_starred: false,
        });
      } else if (resource === 'tags') {
        await createTag({ name: form.name.trim(), color: form.color, team_id: team.id });
      } else if (resource === 'subtasks') {
        await createSubtask({ title: form.title.trim(), task_id: form.task_id, team_id: team.id, is_completed: false });
      } else if (resource === 'notes') {
        await createNote({ title: form.title.trim(), context: form.context, task_id: form.task_id, team_id: team.id });
      } else {
        await createPlan({
          title: form.title.trim(),
          description: form.description,
          task_id: form.task_id,
          team_id: team.id,
          date: form.date,
          start_at: form.start_at,
          end_at: form.end_at,
        });
      }
      setForm(emptyForm);
      await loadWorkspace();
      onNotice({ type: 'success', message: `${resources.find((item) => item.key === resource)?.label} added to ${team.name}.` });
    } catch (error) {
      onNotice({ type: 'error', message: getApiErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  };

  const handleTaskCompletion = async (task, isCompleted) => {
    setWorkspace((current) => ({
      ...current,
      tasks: current.tasks.map((item) => item.id === task.id ? { ...item, is_completed: isCompleted } : item),
    }));
    try {
      await toggleTaskComplete(task.id, isCompleted);
    } catch (error) {
      setWorkspace((current) => ({
        ...current,
        tasks: current.tasks.map((item) => item.id === task.id ? { ...item, is_completed: task.is_completed } : item),
      }));
      onNotice({ type: 'error', message: getApiErrorMessage(error) });
    }
  };

  const handleMentionChange = async (task, member, mentioned) => {
    setUpdatingMention(true);
    try {
      if (mentioned) {
        const response = await addTaskAssignee(task.id, member.id);
        const assignee = response?.data?.data;
        setTaskAssignees((current) => ({
          ...current,
          [String(task.id)]: [...(current[String(task.id)] || []), assignee || { task_id: task.id, member_id: member.id }],
        }));
      } else {
        await removeTaskAssignee(task.id, member.id);
        setTaskAssignees((current) => ({
          ...current,
          [String(task.id)]: (current[String(task.id)] || []).filter((assignee) => assignee.member_id !== member.id),
        }));
      }
    } catch (error) {
      onNotice({ type: 'error', message: getApiErrorMessage(error) });
    } finally {
      setUpdatingMention(false);
    }
  };

  const records = workspace[resource] || [];
  const weekDays = getCurrentWeekDays();
  const weekDateKeys = new Set(weekDays.map(getDateKey));
  const scheduledTasks = workspace.tasks.filter((task) => (
    weekDateKeys.has(getDateKey(task.due_date))
    || workspace.plans.some((plan) => String(plan.task_id) === String(task.id) && weekDateKeys.has(getDateKey(plan.date)))
  ));
  const taskRequired = ['subtasks', 'notes', 'plans'].includes(resource);
  const titleOnly = ['tasks', 'subtasks', 'notes', 'plans'].includes(resource);
  const linkedResources = resource === 'tasks' ? ['subtasks', 'notes', 'plans'] : taskRequired ? [resource] : [];

  const renderLinkedRecord = (linkedResource, record) => (
    <div key={`${linkedResource}-${record.id}`} className="flex min-w-0 items-start gap-2 border-l-2 border-slate-200 bg-slate-50/70 px-3 py-2 text-slate-600">
      <span className="mt-0.5 shrink-0 text-slate-400">{linkedResource === 'subtasks' ? <ListTodo size={14} /> : linkedResource === 'notes' ? <FileText size={14} /> : <CalendarDays size={14} />}</span>
      <div className="min-w-0 flex-1">
        <h5 className={`wrap-break-word text-xs font-medium ${linkedResource === 'subtasks' && record.is_completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{getRecordTitle(linkedResource, record)}</h5>
        <p className="mt-0.5 wrap-break-word text-[11px] leading-4 text-slate-500">{getRecordDescription(linkedResource, record)}</p>
      </div>
      {linkedResource === 'subtasks' && record.is_completed && <span className="shrink-0 text-[10px] text-slate-500">Done</span>}
    </div>
  );

  const renderTaskGroups = () => {
    const linkedRecords = linkedResources.flatMap((linkedResource) => workspace[linkedResource].map((record) => ({ linkedResource, record })));
    const taskIds = new Set(workspace.tasks.map((task) => String(task.id)));
    const groups = workspace.tasks.map((task) => ({
      task,
      children: linkedRecords.filter(({ record }) => String(record.task_id) === String(task.id)),
    })).filter(({ children }) => resource === 'tasks' || children.length > 0);
    const unlinked = linkedRecords.filter(({ record }) => !taskIds.has(String(record.task_id)));

    return <div className="divide-y divide-slate-100 border-y border-slate-200 bg-white">
      {groups.map(({ task, children }) => (
        <section key={task.id}>
          {resource === 'tasks' ? (
            <article className="flex min-w-0 items-start gap-3 px-3 py-4 sm:px-4">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-violet-50 text-violet-700"><CircleDot size={15} /></span>
              <input type="checkbox" checked={Boolean(task.is_completed)} onChange={(event) => handleTaskCompletion(task, event.target.checked)} className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-violet-600 focus:ring-violet-500" aria-label={`Mark ${task.title} ${task.is_completed ? 'incomplete' : 'complete'}`} />
              <div className="min-w-0 flex-1">
                <h4 className={`wrap-break-word text-sm font-medium ${task.is_completed ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{getRecordTitle('tasks', task)}</h4>
                <p className="mt-1 wrap-break-word text-xs leading-5 text-slate-500">{getRecordDescription('tasks', task)}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {(taskAssignees[String(task.id)] || []).map((assignee) => {
                    const member = members.find((item) => item.id === assignee.member_id);
                    return member ? <span key={assignee.member_id} className="inline-flex max-w-full items-center gap-1 rounded bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-800"><AtSign size={12} />{member.name || `Member ${member.user_id?.slice(0, 8) || ''}`}</span> : null;
                  })}
                  <button type="button" onClick={() => setMentionTaskId(mentionTaskId === task.id ? null : task.id)} className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-violet-800 hover:bg-violet-50" aria-expanded={mentionTaskId === task.id}><AtSign size={13} /> Mention</button>
                </div>
                {mentionTaskId === task.id && <div className="mt-2 grid gap-1 rounded-md border border-slate-200 bg-white p-2 sm:grid-cols-2">
                  {members.map((member) => {
                    const mentioned = (taskAssignees[String(task.id)] || []).some((assignee) => assignee.member_id === member.id);
                    return <label key={member.id} className="flex min-w-0 items-center gap-2 rounded px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50"><input type="checkbox" checked={mentioned} disabled={updatingMention} onChange={(event) => handleMentionChange(task, member, event.target.checked)} className="h-3.5 w-3.5 shrink-0 rounded border-slate-300 text-violet-600 focus:ring-violet-500" /><span className="truncate">@{member.name || `Member ${member.user_id?.slice(0, 8) || ''}`}</span></label>;
                  })}
                </div>}
              </div>
              <span className={`shrink-0 rounded px-2 py-1 text-[11px] capitalize ${task.is_completed ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{task.is_completed ? 'done' : task.priority || 'low'}</span>
            </article>
          ) : <h4 className="px-3 pt-3 text-xs font-semibold text-slate-700 sm:px-4">{task.title || 'Untitled task'}</h4>}
          {children.length > 0 && <div className="ml-11 space-y-1 px-3 pb-3 sm:ml-14 sm:px-4">{children.map(({ linkedResource, record }) => renderLinkedRecord(linkedResource, record))}</div>}
        </section>
      ))}
      {unlinked.length > 0 && <section>
        <h4 className="px-3 pt-3 text-xs font-semibold text-slate-500 sm:px-4">Task unavailable</h4>
        <div className="ml-11 space-y-1 px-3 pb-3 sm:ml-14 sm:px-4">{unlinked.map(({ linkedResource, record }) => renderLinkedRecord(linkedResource, record))}</div>
      </section>}
    </div>;
  };

  return (
    <section>
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Workspace</h2>
          <p className="mt-1 text-sm text-slate-500">Shared work and records for {team.name}.</p>
        </div>
        <span className="text-xs text-slate-500">{records.length} {records.length === 1 ? 'item' : 'items'}</span>
      </div>

      <section className="mb-8 border-y border-slate-200 py-4" aria-label="Weekly team schedule">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Weekly task plan</h3>
            <p className="mt-1 text-xs text-slate-500">Due dates and planned work this week</p>
          </div>
          <span className="shrink-0 text-xs text-slate-500">{scheduledTasks.length} scheduled</span>
        </div>
        <div className="overflow-x-auto overscroll-x-contain">
          <div className="min-w-175">
            <div className="grid grid-cols-[minmax(150px,1.5fr)_repeat(7,minmax(72px,1fr))] border-b border-slate-200">
              <span className="px-3 py-2 text-[10px] font-semibold uppercase text-slate-400">Task</span>
              {weekDays.map((day) => {
                const isToday = getDateKey(day) === getDateKey(new Date());
                return <div key={day.toISOString()} className={`px-2 py-2 text-center ${isToday ? 'bg-slate-100' : ''}`}>
                  <span className="block text-[10px] text-slate-400">{day.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                  <span className={`mt-0.5 block text-xs font-semibold ${isToday ? 'text-slate-950' : 'text-slate-600'}`}>{day.getDate()}</span>
                </div>;
              })}
            </div>
            {scheduledTasks.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-slate-500">No tasks or plans scheduled this week.</p>
            ) : scheduledTasks.slice(0, 12).map((task) => (
              <div key={task.id} className="grid min-h-14 grid-cols-[minmax(150px,1.5fr)_repeat(7,minmax(72px,1fr))] border-b border-slate-100 last:border-0">
                <div className="flex min-w-0 items-center gap-2 px-3 py-2">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${task.is_completed ? 'bg-slate-300' : 'bg-slate-900'}`} />
                  <span className={`truncate text-xs font-medium ${task.is_completed ? 'text-slate-400 line-through' : 'text-slate-700'}`} title={task.title}>{task.title || 'Untitled task'}</span>
                </div>
                {weekDays.map((day) => {
                  const dayKey = getDateKey(day);
                  const dueToday = getDateKey(task.due_date) === dayKey;
                  const dayPlans = workspace.plans.filter((plan) => String(plan.task_id) === String(task.id) && getDateKey(plan.date) === dayKey);
                  return <div key={dayKey} className={`flex min-w-0 flex-col justify-center gap-1 border-l border-slate-100 px-1.5 py-2 ${dayKey === getDateKey(new Date()) ? 'bg-slate-50/70' : ''}`}>
                    {dueToday && <span className="truncate rounded-sm bg-slate-900 px-1.5 py-1 text-[10px] font-medium text-white" title="Task due">Due</span>}
                    {dayPlans.map((plan) => <span key={plan.id} className="truncate rounded-sm border border-slate-300 bg-white px-1.5 py-1 text-[10px] text-slate-700" title={`${plan.title}${plan.start_at ? ` · ${plan.start_at}` : ''}`}>{plan.start_at || plan.title}</span>)}
                  </div>;
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mb-6 flex gap-2 overflow-x-auto border-b border-slate-200" role="tablist" aria-label="Workspace resources">
        {resources.map(({ key, label, Icon }) => (
          <button key={key} type="button" role="tab" aria-selected={resource === key} onClick={() => setResource(key)} className={`flex shrink-0 items-center gap-2 border-b-2 px-2.5 py-3 text-sm font-medium ${resource === key ? 'border-[#6242c7] text-[#5032ae]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            <Icon size={15} />{label}<span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">{workspace[key]?.length || 0}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(260px,340px)]">
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-800">{resources.find((item) => item.key === resource)?.label} in this workspace</h3>
          {loading ? <div className="border-y border-slate-200 py-10 text-center text-sm text-slate-500">Loading team workspace...</div> : records.length === 0 ? (
            <div className="border-y border-dashed border-slate-300 py-10 text-center">
              <span className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-700"><CircleDot size={18} /></span>
              <p className="text-sm font-medium text-slate-800">Nothing here yet</p>
              <p className="mt-1 text-xs text-slate-500">Add the first {resources.find((item) => item.key === resource)?.label.toLowerCase().replace(/s$/, '')} for this team.</p>
            </div>
          ) : (
            linkedResources.length > 0 ? renderTaskGroups() : <div className="divide-y divide-slate-100 border-y border-slate-200 bg-white">
              {records.map((record) => {
                const hasSelectedColor = resource === 'projects' || resource === 'tags';
                const selectedColor = record.color || '#6242c7';
                const lightSelectedColor = isLightColor(selectedColor);
                return <article key={record.id} style={hasSelectedColor ? { backgroundColor: selectedColor, color: lightSelectedColor ? '#1e293b' : '#ffffff' } : undefined} className="flex min-w-0 items-start gap-3 px-3 py-4 sm:px-4">
                  <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${hasSelectedColor ? 'bg-white/25' : 'bg-violet-50 text-violet-700'}`}><CircleDot size={15} /></span>
                  <div className="min-w-0 flex-1">
                    <h4 className={`wrap-break-word text-sm font-medium ${hasSelectedColor ? '' : 'text-slate-900'}`}>{getRecordTitle(resource, record)}</h4>
                    <p className={`mt-1 wrap-break-word text-xs leading-5 ${hasSelectedColor ? (lightSelectedColor ? 'text-slate-700' : 'text-white/80') : 'text-slate-500'}`}>{getRecordDescription(resource, record)}</p>
                  </div>
                  {resource === 'tasks' && <span className="shrink-0 rounded bg-slate-100 px-2 py-1 text-[11px] capitalize text-slate-600">{record.is_completed ? 'done' : record.priority || 'low'}</span>}
                  {resource === 'subtasks' && record.is_completed && <span className="shrink-0 rounded bg-emerald-50 px-2 py-1 text-[11px] text-emerald-700">Done</span>}
                </article>;
              })}
            </div>
          )}
        </div>

        <form onSubmit={handleCreate} className="h-fit border-t border-slate-200 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-800"><Plus size={16} /> Add {resources.find((item) => item.key === resource)?.label.toLowerCase().replace(/s$/, '')}</h3>
          {titleOnly ? (
            <label className="mb-3 block text-xs font-medium text-slate-600">Title<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} maxLength={160} required placeholder="Give it a title" className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500" /></label>
          ) : (
            <label className="mb-3 block text-xs font-medium text-slate-600">Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} maxLength={100} required placeholder="Give it a name" className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500" /></label>
          )}

          {(resource === 'projects' || resource === 'tags') && <label className="mb-3 flex items-center justify-between text-xs font-medium text-slate-600">Color<input type="color" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} className="h-9 w-12 cursor-pointer rounded border border-slate-200 bg-white p-1" /></label>}
          {resource === 'tasks' && <>
            <label className="mb-3 block text-xs font-medium text-slate-600">Details<textarea value={form.context} onChange={(event) => setForm({ ...form, context: event.target.value })} rows={3} className="mt-1.5 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500" /></label>
            <label className="mb-3 block text-xs font-medium text-slate-600">Priority<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })} className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm capitalize outline-none focus:border-violet-500"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
            <label className="mb-3 block text-xs font-medium text-slate-600">Project<select value={form.project_id} onChange={(event) => setForm({ ...form, project_id: event.target.value })} className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500"><option value="">No project</option>{workspace.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
            <label className="mb-3 block text-xs font-medium text-slate-600">Due date<input type="date" value={form.due_date} onChange={(event) => setForm({ ...form, due_date: event.target.value })} className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500" /></label>
          </>}
          {resource === 'notes' && <label className="mb-3 block text-xs font-medium text-slate-600">Note<textarea value={form.context} onChange={(event) => setForm({ ...form, context: event.target.value })} rows={3} className="mt-1.5 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500" /></label>}
          {resource === 'plans' && <>
            <label className="mb-3 block text-xs font-medium text-slate-600">Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={2} className="mt-1.5 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500" /></label>
            <label className="mb-3 block text-xs font-medium text-slate-600">Date<input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500" /></label>
            <div className="mb-3 grid grid-cols-2 gap-2"><label className="block text-xs font-medium text-slate-600">Start<input type="time" value={form.start_at} onChange={(event) => setForm({ ...form, start_at: event.target.value })} required className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-2 py-2.5 text-sm outline-none focus:border-violet-500" /></label><label className="block text-xs font-medium text-slate-600">End<input type="time" value={form.end_at} onChange={(event) => setForm({ ...form, end_at: event.target.value })} required className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-2 py-2.5 text-sm outline-none focus:border-violet-500" /></label></div>
          </>}
          {taskRequired && <label className="mb-3 block text-xs font-medium text-slate-600">Task<select value={form.task_id} onChange={(event) => setForm({ ...form, task_id: event.target.value })} required className="mt-1.5 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500"><option value="">Choose a team task</option>{workspace.tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}</select></label>}
          <button type="submit" disabled={saving || loading || (taskRequired && workspace.tasks.length === 0)} className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#6242c7] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#5032ae] disabled:cursor-not-allowed disabled:opacity-50"><Plus size={15} />{saving ? 'Adding...' : 'Add to workspace'}</button>
          {taskRequired && workspace.tasks.length === 0 && <p className="mt-2 text-xs leading-5 text-slate-500">Add a team task first to attach this item.</p>}
        </form>
      </div>
    </section>
  );
}