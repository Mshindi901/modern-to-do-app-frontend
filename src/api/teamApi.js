import api from './axios.js';

export const getOwnedTeams = () => api.get('/team/user');
export const getUserTeamMemberships = () => api.get('/team-members/user');
export const getTeam = (id) => api.get(`/team/${id}`);
export const createTeam = (payload) => api.post('/team', payload);
export const updateTeam = (id, payload) => api.put(`/teams/${id}`, payload);
export const getTeamMembers = (id) => api.get(`/team-members/teams/${id}`);
export const addTeamMember = (payload) => api.post('/team-members', payload);
export const updateTeamMember = (id, role) => api.put(`/team-members/${id}`, { role });
export const removeTeamMember = (id) => api.delete(`/team-members/${id}`);