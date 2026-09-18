import api from './axios.js';

export const getUserProjects = () => api.get('/project/user');
export const createProject = (payload) => api.post('/project', payload);
export const updateProject = (id, payload) => api.put(`/projects/user/${id}`, payload);
export const deleteProject = (id) => api.delete(`/projects/${id}`);
