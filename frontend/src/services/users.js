import { api } from './api';

export const usersApi = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data.data;
  },
  
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data.data;
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data.data;
  },
};
