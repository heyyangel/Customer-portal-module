import { create } from "zustand";
import { usersApi } from "../services/users";
import { refreshSocketAuth } from "../services/socketService";
import { useNotificationStore } from "./notificationStore";

export const useUserStore = create((set) => ({
  user: null,
  loading: !!localStorage.getItem('token'),
  error: null,
  
  login: async (credentials) => {
    set({ loading: true, error: null });
    try {
      const { token } = await usersApi.login(credentials);
      localStorage.setItem('token', token);
      
      const user = await usersApi.getCurrentUser();
      set({ user, loading: false });
      refreshSocketAuth(); // rejoin socket rooms as the logged-in user
      return true;
    } catch (err) {
      set({ error: err.response?.data?.message || "Login failed", loading: false });
      return false;
    }
  },

  register: async (userData) => {
    set({ loading: true, error: null });
    try {
      const { token } = await usersApi.register(userData);
      localStorage.setItem('token', token);
      
      const user = await usersApi.getCurrentUser();
      set({ user, loading: false });
      refreshSocketAuth();
      return true;
    } catch (err) {
      set({ error: err.response?.data?.message || "Registration failed", loading: false });
      return false;
    }
  },

  fetchUser: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ user: null, loading: false });
      return;
    }

    set({ loading: true, error: null });
    try {
      const user = await usersApi.getCurrentUser();
      set({ user, loading: false });
    } catch (err) {
      localStorage.removeItem('token');
      set({ error: "Session expired", user: null, loading: false });
    }
  },

  updateProfile: async (updates) => {
    try {
      const user = await usersApi.updateProfile(updates);
      set({ user });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to update profile' };
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      await usersApi.changePassword(currentPassword, newPassword);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to change password' };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null });
    useNotificationStore.getState().clear();
    refreshSocketAuth(); // drop out of the user/admin rooms
  },
}));

