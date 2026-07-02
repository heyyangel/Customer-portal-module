import { create } from "zustand";
import { adminApi } from "../services/admin";

export const useAdminStore = create((set, get) => ({
  users: [],
  roles: [],
  loading: false,
  error: null,

  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const users = await adminApi.getUsers();
      set({ users, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || "Failed to fetch users", loading: false });
    }
  },

  fetchRoles: async () => {
    set({ loading: true, error: null });
    try {
      const roles = await adminApi.getRoles();
      set({ roles, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || "Failed to fetch roles", loading: false });
    }
  },

  updateUserRole: async (userId, roleId) => {
    try {
      const updatedUser = await adminApi.updateUserRole(userId, roleId);
      set((state) => ({
        users: state.users.map((u) => (u._id === userId ? updatedUser : u))
      }));
      return true;
    } catch (err) {
      set({ error: err.response?.data?.message || "Failed to update user role" });
      return false;
    }
  },

  updateRolePermissions: async (roleId, permissions) => {
    try {
      const updatedRole = await adminApi.updateRolePermissions(roleId, permissions);
      set((state) => ({
        roles: state.roles.map((r) => (r._id === roleId ? updatedRole : r))
      }));
      return true;
    } catch (err) {
      set({ error: err.response?.data?.message || "Failed to update role permissions" });
      return false;
    }
  },
}));
