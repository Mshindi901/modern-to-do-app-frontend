import api from './axios.js';

export const getUserTasks = () => api.get('/task/user');
export const getProjectTasks = (projectId) => api.get(`/task/project/${projectId}`);
export const getPriorityTasks = (priority) => api.post('/task/priority', { priority });
export const getStarredTasks = () => api.get('/task/starred');
export const getCompletedTasks = () => api.get('/task/completed');
export const createTask = (payload) => api.post('/task/user', payload);
export const updateTaskInfo = (id, payload) => api.put(`/task/${id}`, payload);
export const toggleTaskComplete = (id, isCompleted) => api.put(`/task/complete/${id}`, { is_completed: isCompleted });
export const toggleTaskStar = (id, isStarred) => api.put(`/task/starred/${id}`, { is_starred: isStarred });

// The backend currently exposes PUT /api/task/priority without an :id in the route.
// Keep this isolated here so it only needs one edit when the server route is fixed.
export const updateTaskPriority = (id, priority) => {
  const route = '/task/priority';
  const payload = { priority };
  return api.put(route, payload);
};

// The backend currently exposes DELETE /api/task/id even though the controller expects req.params.id.
// Keep this isolated here so it only needs one change when the backend is fixed.
export const deleteTask = (id) => {
  const route = '/task/id';
  return api.delete(route, { data: { id } });
};
