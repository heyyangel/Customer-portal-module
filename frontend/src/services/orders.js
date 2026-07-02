import { api } from "./api";

export const mapOrder = (order) => {
  if (!order) return null;
  
  // Adapt single-product MongoDB schema to frontend's expected items array
  const items = order.items || [{
    product: {
      id: order.skuCode,
      code: order.skuCode,
      name: order.brand ? `${order.brand} Product` : order.skuCode,
      warehouse: 'Default',
      price: 0,
      availableStock: order.requestedQty || 0,
      unit: 'PCS'
    },
    orderQuantity: order.requestedQty || 0
  }];

  const totalQuantity = order.requestedQty || items.reduce((sum, item) => sum + (item.orderQuantity || item.quantity || 0), 0);
  
  return {
    ...order,
    id: order._id,
    orderNumber: order.orderId || order.orderNumber || order._id,
    customer: order.company || order.customer || 'Unknown',
    date: order.createdAt || order.date || new Date().toISOString(),
    workflowStage: order.status, 
    items,
    totalQuantity,
    estimatedValue: order.totalValue || 0,
    grandTotal: order.grandTotal || 0,
    orderValue: order.grandTotal || order.totalValue || 0, // For ApprovalTable
    priority: order.priority || 'Medium',
    assignedTo: order.assignedToRole || 'Unassigned',
    createdDate: order.createdAt || order.date || new Date().toISOString(),
    auditLogs: (order.auditLogs || []).map((log) => ({
      id: log._id || Math.random().toString(),
      action: log.action,
      user: log.user,
      role: log.role,
      timestamp: log.timestamp,
      ip: log.ip
    })),
    comments: (order.comments || []).map((c) => ({
      id: c._id || Math.random().toString(),
      user: c.user,
      role: c.role,
      text: c.text,
      timestamp: c.timestamp
    }))
  };
};

export const ordersApi = {
  getAll: async () => {
    const response = await api.get('/orders');
    return (response.data.data || []).map(mapOrder);
  },

  getById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return mapOrder(response.data.data);
  },

  create: async (orderData) => {
    const payload = {
      customer: orderData.customer,
      poNumber: orderData.poNumber,
      deliveryLocation: orderData.deliveryLocation,
      remarks: orderData.remarks,
      items: orderData.items.map((item) => ({
        productId: item.product.id || item.product._id,
        quantity: item.orderQuantity
      })),
      priority: orderData.priority || 'Medium',
    };
    const response = await api.post('/orders', payload);
    return mapOrder(response.data.data);
  },

  updateStatus: async (id, status, remarks) => {
    const response = await api.put(`/orders/${id}/status`, { status, remarks });
    return mapOrder(response.data.data);
  },

  assignOrder: async (id, role, remarks) => {
    const response = await api.put(`/orders/${id}/assign`, { role, remarks });
    return mapOrder(response.data.data);
  }
};
