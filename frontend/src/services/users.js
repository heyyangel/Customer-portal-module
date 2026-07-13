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

  updateProfile: async (updates) => {
    const response = await api.patch('/auth/me', updates);
    return response.data.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/auth/me/password', { currentPassword, newPassword });
    return response.data;
  },
};
