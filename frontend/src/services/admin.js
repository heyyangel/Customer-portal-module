import { api } from './api';

export const adminApi = {
  getUsers: async () => {
    const response = await api.get('/users');
    return response.data.data;
  },

  updateUserRole: async (userId, roleId) => {
    const response = await api.put(`/users/${userId}/roles`, { roleIds: [roleId] });
    return response.data.data;
  },

  createUser: async (payload) => {
    const response = await api.post('/users', payload);
    return response.data.data;
  },

  updateUser: async (userId, updates) => {
    const response = await api.patch(`/users/${userId}`, updates);
    return response.data.data;
  },

  resetUserPassword: async (userId, newPassword) => {
    const response = await api.put(`/users/${userId}/password`, { newPassword });
    return response.data;
  },

  getRoles: async () => {
    const response = await api.get('/roles');
    return response.data.data;
  },

  updateRolePermissions: async (roleId, permissions) => {
    const response = await api.put(`/roles/${roleId}/permissions`, { permissions });
    return response.data.data;
  }
};
