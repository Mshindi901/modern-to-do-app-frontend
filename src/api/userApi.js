import api from './axios.js';

export const getCurrentUser = () => api.post('/user');
export const getAllUsers = () => api.get('/users');
export const findUserByEmail = (email) => api.post('/user/email', { email });
export const updateUserInfo = (payload) => api.put('/user/info', payload);
export const updateUserPassword = (newPassword) => api.put('/user/password', { new_password: newPassword });
export const deleteUser = (id) => api.delete(`/user/${id}`);
