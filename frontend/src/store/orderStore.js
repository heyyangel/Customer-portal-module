import { create } from "zustand";
import { ordersApi } from "../services/orders";

export const useOrderStore = create((set, get) => ({
  orders: [],
  loading: false,
  submitting: false,
  error: null,

  fetchOrders: async () => {
    set({ loading: true, error: null });
    try {
      const orders = await ordersApi.getAll();
      set({ orders, loading: false });
    } catch (err) {
      set({ error: err.message || "Failed to fetch orders", loading: false });
    }
  },

  createOrder: async (orderData) => {
    set({ submitting: true, error: null });
    try {
      const newOrder = await ordersApi.create(orderData);
      set({
        orders: [newOrder, ...get().orders],
        submitting: false,
      });
      return newOrder;
    } catch (err) {
      set({
        error: err.message || "Failed to submit order",
        submitting: false,
      });
      throw err;
    }
  },

  updateOrderStatus: async (id, status) => {
    try {
      const updatedOrder = await ordersApi.updateStatus(id, status);
      if (updatedOrder) {
        set({
          orders: get().orders.map((o) => (o.id === id ? updatedOrder : o)),
        });
      }
    } catch (err) {
      console.error("Failed to update order status", err);
    }
  },
}));
