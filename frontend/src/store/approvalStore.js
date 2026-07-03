import { create } from 'zustand';
import { ordersApi } from '../services/orders';

export const useApprovalStore = create((set, get) => ({
  allApprovals: [],
  approvals: [],
  selectedApproval: null,
  filters: { stage: 'all', priority: 'all', assignedTo: 'all' },
  searchQuery: '',
  sortBy: 'createdDate',
  sortOrder: 'desc',
  page: 1,
  limit: 15,
  notifications: 0,
  loading: false,
  error: null,

  fetchApprovals: async () => {
    set({ loading: true, error: null });
    try {
      const orders = await ordersApi.getAll();
      // Only show orders that require some workflow stage / approval status (or show all for admin view)
      set({
        allApprovals: orders,
        approvals: orders,
        notifications: orders.filter(o => o.status === 'Booked').length,
        loading: false
      });
      get().applyFilters();
      if (get().selectedApproval) {
        const updatedSelected = orders.find(o => o.id === get().selectedApproval.id);
        if (updatedSelected) {
          set({ selectedApproval: updatedSelected });
        }
      }
    } catch (err) {
      set({ error: err.message || 'Failed to fetch approvals', loading: false });
    }
  },

  applyFilters: () => {
    const { allApprovals, filters, searchQuery, sortBy, sortOrder } = get();
    let result = [...allApprovals];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          String(a.orderNumber || '').toLowerCase().includes(q) ||
          String(a.poNumber || '').toLowerCase().includes(q) ||
          String(a.customer || '').toLowerCase().includes(q)
      );
    }

    if (filters.stage !== 'all') {
      result = result.filter((a) => a.workflowStage === filters.stage);
    }
    if (filters.priority !== 'all') {
      result = result.filter((a) => a.priority === filters.priority);
    }
    if (filters.assignedTo !== 'all') {
      result = result.filter((a) => a.assignedToRole === filters.assignedTo);
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'createdDate')
        cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'orderValue') cmp = (a.grandTotal || 0) - (b.grandTotal || 0);
      if (sortBy === 'orderNumber')
        cmp = String(a.orderNumber || '').localeCompare(String(b.orderNumber || ''));
      if (sortBy === 'priority')
        cmp = String(a.priority || '').localeCompare(String(b.priority || ''));
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    set({ approvals: result, page: 1 });
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
  setSelectedApproval: (approval) => set({ selectedApproval: approval }),

  approveOrder: async (id, remarks) => {
    try {
      set({ loading: true });
      await ordersApi.updateStatus(id, 'Approved', remarks);
      await get().fetchApprovals();
      return { success: true };
    } catch (err) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      return { success: false, error: err.response?.data?.message || err.message };
    }
  },

  rejectOrder: async (id, remarks) => {
    try {
      set({ loading: true });
      await ordersApi.updateStatus(id, 'Cancelled', remarks);
      await get().fetchApprovals();
      return { success: true };
    } catch (err) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      return { success: false, error: err.response?.data?.message || err.message };
    }
  },

  requestModification: async (id, remarks) => {
    try {
      set({ loading: true });
      await ordersApi.updateStatus(id, 'Booked', remarks);
      await get().fetchApprovals();
      return { success: true };
    } catch (err) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      return { success: false, error: err.response?.data?.message || err.message };
    }
  },

  assignOrder: async (id, role, remarks) => {
    try {
      set({ loading: true });
      await ordersApi.assignOrder(id, role, remarks);
      await get().fetchApprovals();
      return { success: true };
    } catch (err) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      return { success: false, error: err.response?.data?.message || err.message };
    }
  },

  refresh: async () => {
    await get().fetchApprovals();
  },
}));
