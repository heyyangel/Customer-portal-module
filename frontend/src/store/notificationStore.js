import { create } from "zustand";
import { notificationsApi } from "../services/reservations";

// Live notification feed. Seeded from the REST API on load, then kept up to date
// in real time by socketService, which calls addNotification() on every
// `notification-received` socket event.
export const useNotificationStore = create((set, get) => ({
  notifications: [],
  loading: false,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const notifications = await notificationsApi.getAll();
      set({ notifications, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  // Prepend a freshly-received notification (de-duped by _id).
  addNotification: (notif) =>
    set((state) => ({
      notifications: [notif, ...state.notifications.filter((n) => n._id !== notif._id)],
    })),

  markAllRead: async () => {
    const prev = get().notifications;
    if (!prev.some((n) => !n.read)) return;
    set({ notifications: prev.map((n) => ({ ...n, read: true })) });
    try {
      await notificationsApi.markAllRead();
    } catch {
      set({ notifications: prev }); // roll back on failure
    }
  },

  markOneRead: async (id) => {
    const target = get().notifications.find((n) => n._id === id);
    if (!target || target.read) return;
    set((state) => ({
      notifications: state.notifications.map((n) => (n._id === id ? { ...n, read: true } : n)),
    }));
    try {
      await notificationsApi.markOneRead(id);
    } catch {
      /* best-effort; the optimistic update stays */
    }
  },

  clear: () => set({ notifications: [] }),

  unreadCount: () => get().notifications.filter((n) => !n.read).length,
}));
