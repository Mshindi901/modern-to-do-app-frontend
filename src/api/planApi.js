import api from './axios.js';

export const getUserPlans = () => api.get('/plans/user');
export const getTaskPlans = (taskId) => api.get(`/plans/task/${taskId}`);
export const createPlan = (payload) => api.post('/plans', payload);
export const updatePlan = (id, payload) => api.put(`/plans/${id}`, payload);
export const deletePlan = (id) => api.delete(`/plans/${id}`);