import api from './axios.js';

export const signUp = (payload) => api.post('/auth/signup', payload);
export const signIn = (payload) => api.post('/auth/signin', payload);
