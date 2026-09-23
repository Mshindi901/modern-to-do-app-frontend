import api from './axios.js';

export const getUserNotes = () => api.get('/notes/user');
export const getTaskNotes = (taskId) => api.get(`/notes/tasks/${taskId}`);
export const createNote = (payload) => api.post('/notes', payload);
export const updateNote = (id, payload) => api.put(`/notes/${id}`, payload);
export const deleteNote = (id) => api.delete(`/notes/${id}`);