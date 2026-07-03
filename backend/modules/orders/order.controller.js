import mongoose from 'mongoose';
import Order from '../../models/Order.js';
import Product from '../../models/Product.js';
import { io } from '../../server.js';

export const getOrders = async (req, res, next) => {
  try {
    let query = {};
    // If not Admin, restrict to orders created by this user
    if (req.user.role !== 'Admin') {
      query.user = req.user._id;
    }
    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

export const createOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { customer, poNumber, deliveryLocation, remarks, items, priority } = req.body;

    let totalValue = 0;
    let totalTax = 0;
    let grandTotal = 0;

    // Validate and process inventory
    for (let item of items) {
      const product = await Product.findById(item.productId).session(session);
      
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      if (product.availableStock < item.quantity) {
        throw new Error(`Insufficient stock for product ${product.name}`);
      }

      // Reserve stock
      product.availableStock -= item.quantity;
      product.reservedStock += item.quantity;
      await product.save({ session });

      item.price = product.price;
      item.subtotal = item.quantity * product.price;
      item.tax = item.subtotal * 0.18; // 18% tax mock
      item.product = product._id;
      item.productCode = product.productCode;
      item.name = product.name;
      item.warehouse = product.warehouse;

      totalValue += item.subtotal;
      totalTax += item.tax;
    }

    grandTotal = totalValue + totalTax;

    const orderNumber = `SO-${new Date().getFullYear()}-${Math.floor(Math.random() * 100000).toString().padStart(6, '0')}`;

    const newOrder = await Order.create([{
      orderNumber,
      poNumber,
      customer,
      deliveryLocation,
      remarks,
      items,
      priority,
      totalValue,
      totalTax,
      grandTotal,
      createdBy: req.user._id,
      timeline: [{
        stage: 'Created',
        status: 'Completed',
        date: new Date(),
        remarks: 'Order successfully created and inventory reserved.'
      }],
      auditLogs: [{
        action: 'Order Submitted',
        user: req.user.name,
        role: req.user.roles?.[0]?.name || 'Sales Executive',
        timestamp: new Date(),
        ip: req.ip || '127.0.0.1'
      }],
      comments: remarks ? [{
        user: req.user.name,
        role: req.user.roles?.[0]?.name || 'Sales Executive',
        text: remarks,
        timestamp: new Date()
      }] : []
    }], { session });

    await session.commitTransaction();
    
    // Emit socket event
    io.emit('order-created', { orderId: newOrder[0]._id, orderNumber });

    res.status(201).json({ success: true, data: newOrder[0] });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;

    const allowed = Order.schema.path('status').enumValues;
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${allowed.join(', ')}` });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // The Order schema is a flat record (no auditLogs/comments/timeline arrays),
    // so only update fields that actually exist on it.
    order.status = status;
    order.statusTimestamp = new Date();
    if (remarks) order.remarks = remarks;

    await order.save();

    io.emit('order-updated', { orderId: order._id, status });

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

export const assignOrder = async (req, res, next) => {
  try {
    const { role, remarks } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.assignedToRole = role;

    const userRole = req.user.roles?.[0]?.name || 'Administrator';

    // Add audit log
    order.auditLogs.unshift({
      action: `Assigned to ${role}`,
      user: req.user.name,
      role: userRole,
      timestamp: new Date(),
      ip: req.ip || '127.0.0.1'
    });

    // Add comment if present
    if (remarks) {
      order.comments.unshift({
        user: req.user.name,
        role: userRole,
        text: remarks,
        timestamp: new Date()
      });
    }

    await order.save();

    // Emit event
    io.emit('order-updated', { orderId: order._id, assignedToRole: role });

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};
