import { api } from "./api";

export const reservationsApi = {
  getAll: async () => {
    const response = await api.get('/reservations');
    return response.data.data || [];
  },

  getPending: async () => {
    const response = await api.get('/reservations/pending');
    return response.data.data || [];
  },

  create: async (productId, quantity) => {
    const response = await api.post('/reservations', { productId, quantity });
    return response.data.data;
  },

  updateQuantity: async (id, quantity) => {
    const response = await api.put(`/reservations/${id}`, { quantity });
    return response.data.data;
  },

  cancel: async (id) => {
    const response = await api.delete(`/reservations/${id}`);
    return response.data.data;
  },

  confirm: async (deliveryLocation, remarks) => {
    const response = await api.post('/reservations/confirm', { deliveryLocation, remarks });
    return response.data.data;
  }
};

export const notificationsApi = {
  getAll: async () => {
    const response = await api.get('/notifications');
    return response.data.data || [];
  },

  markAllRead: async () => {
    const response = await api.put('/notifications/mark-read');
    return response.data;
  }
};
