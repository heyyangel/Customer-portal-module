import { create } from "zustand";
import { ordersApi } from "../services/orders";

const computeMetrics = (orders) => {
  const now = new Date();
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  return {
    total: orders.length,
    pending: orders.filter((o) => o.status === "Booked").length,
    approved: orders.filter((o) => o.status === "Approved").length,
    ready: 0,
    dispatched: orders.filter((o) => o.status === "Dispatched").length,
    completed: orders.filter((o) => o.status === "Delivered").length,
    cancelled: orders.filter((o) => o.status === "Cancelled").length,
    rejected: 0,
    today: orders.filter((o) => new Date(o.date).getTime() >= today).length,
    thisMonth: orders.filter((o) => new Date(o.date).getTime() >= thisMonth)
      .length,
  };
};

export const useOrderHistoryStore = create((set, get) => ({
  allOrders: [],
  orders: [],
  filters: { status: "all", customer: "all", orderType: "all" },
  searchQuery: "",
  sortBy: "date",
  sortOrder: "desc",
  page: 1,
  limit: 15,
  selectedOrder: null,
  metrics: {
    total: 0,
    pending: 0,
    approved: 0,
    ready: 0,
    dispatched: 0,
    completed: 0,
    cancelled: 0,
    rejected: 0,
    today: 0,
    thisMonth: 0,
  },
  loading: false,
  error: null,

  fetchOrders: async () => {
    set({ loading: true, error: null });
    try {
      const orders = await ordersApi.getAll();
      set({
        allOrders: orders,
        orders,
        metrics: computeMetrics(orders),
        loading: false,
      });
      get().applyFilters();
    } catch (err) {
      set({ error: err.message || "Failed to fetch orders", loading: false });
    }
  },

  applyFilters: () => {
    const { allOrders, filters, searchQuery, sortBy, sortOrder } = get();

    let result = [...allOrders];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.poNumber.toLowerCase().includes(q) ||
          (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
          o.customer.toLowerCase().includes(q),
      );
    }

    if (filters.status !== "all") {
      result = result.filter((o) => o.status === filters.status);
    }
    if (filters.customer !== "all") {
      result = result.filter((o) => o.customer === filters.customer);
    }
    if (filters.orderType !== "all") {
      result = result.filter((o) => o.orderType === filters.orderType);
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "date")
        cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === "value") cmp = a.grandTotal - b.grandTotal;
      if (sortBy === "status") cmp = a.status.localeCompare(b.status);
      return sortOrder === "asc" ? cmp : -cmp;
    });

    set({ orders: result, page: 1 });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
    get().applyFilters();
  },

  setFilters: (newFilters) => {
    set((state) => ({ filters: { ...state.filters, ...newFilters } }));
    get().applyFilters();
  },

  setSort: (sortBy, sortOrder) => {
    set({ sortBy, sortOrder });
    get().applyFilters();
  },

  setPage: (page) => set({ page }),
  setSelectedOrder: (order) => set({ selectedOrder: order }),

  updateOrderStatus: async (id, status, remarks) => {
    try {
      await ordersApi.updateStatus(id, status, remarks);
      await get().fetchOrders();
      // Keep the open drawer in sync with the refreshed order.
      const updated = get().allOrders.find((o) => o.id === id);
      if (updated) set({ selectedOrder: updated });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || err.message };
    }
  },

  refresh: async () => {
    set({
      filters: { status: "all", customer: "all", orderType: "all" },
      searchQuery: "",
      sortBy: "date",
      sortOrder: "desc",
      page: 1,
    });
    await get().fetchOrders();
  },
}));
