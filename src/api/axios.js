import axios from 'axios';
//I wrote this because a deployment failed on vercel the repo was private so I can make a new push

const api = axios.create({
  baseURL: 'https://modern-to-do-app-backend.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('todo_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const getApiErrorMessage = (error) => {
  const serverMessage = error?.response?.data?.message;
  const fallback = error?.message || 'Something went wrong';

  if (error?.response?.status === 401) {
    return 'Your session expired. Please sign in again.';
  }

  if (error?.response?.status === 403) {
    return "You don't have permission to do that.";
  }

  if (error?.response?.status === 404) {
    return serverMessage || 'The requested resource was not found.';
  }

  if (error?.response?.status === 500) {
    return 'Something went wrong on the server.';
  }

  if (!error?.response) {
    return 'Unable to connect to the server.';
  }

  return serverMessage || fallback;
};

export default api;
