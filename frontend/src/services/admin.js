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

  getRoles: async () => {
    const response = await api.get('/roles');
    return response.data.data;
  },

  updateRolePermissions: async (roleId, permissions) => {
    // Note: ensure backend route is PUT /roles/:id or similar
    const response = await api.put(`/roles/${roleId}`, { permissions });
    return response.data.data;
  }
};
