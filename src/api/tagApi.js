import api from './axios.js';

export const getUserTags = () => api.get('/tasks/user');
export const createTag = (payload) => api.post('/tags/user', payload);
export const attachTagToTask = (payload) => api.post('/tags/task', payload);
export const getTaskTags = (taskId) => api.get(`/tag/task/${taskId}`);
export const updateTag = (id, payload) => api.put(`/tags/${id}`, payload);
export const deleteTag = (id) => api.delete(`/tags/${id}`);
