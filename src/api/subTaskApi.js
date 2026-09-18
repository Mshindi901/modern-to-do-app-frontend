import api from './axios.js';

export const getSubtasksByTask = (taskId) => api.get(`/sub-task/task/${taskId}`);
export const getCompletedSubtasks = (taskId) => api.get(`/sub-task/task/completed/${taskId}`);
export const createSubtask = (payload) => api.post('/sub-task', payload);
export const updateSubtask = (id, payload) => api.put(`/sub-task/${id}`, payload);
export const deleteSubtask = (id) => api.delete(`/sub-task/${id}`);
