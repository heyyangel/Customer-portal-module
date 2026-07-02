import mongoose from 'mongoose';
import Reservation from '../../models/Reservation.js';
import { ProductKoken, ProductBIX, ProductIMADA } from '../../models/Product.js';
import Order from '../../models/Order.js';
import AuditLog from '../../models/AuditLog.js';
import Notification from '../../models/Notification.js';
import MsilCode from '../../models/MsilCode.js';
import { io } from '../../server.js';

// Helper to find product across all brands
const findProductById = async (productId) => {
  let p = await ProductKoken.findById(productId);
  if (p) return p;
  p = await ProductBIX.findById(productId);
  if (p) return p;
  p = await ProductIMADA.findById(productId);
  return p;
};

// Helper to create audit logs
const logEvent = async (user, action, remarks, req) => {
  try {
    await AuditLog.create({
      user: user._id,
      action: action,
      method: req?.method || 'SYSTEM',
      endpoint: req?.originalUrl || 'N/A',
      ipAddress: req?.ip || '127.0.0.1',
      userAgent: req?.headers?.['user-agent'] || 'ERP SYSTEM',
      remarks: remarks // If schema has remarks
    });
  } catch (error) {
    console.error('[Audit Log helper error]', error);
  }
};

// Helper to create notifications
const sendNotification = (userId, title, message, type = 'reservation') => {
  Notification.create({
    user: userId,
    title,
    message,
    type
  }).then(notif => {
    io.emit('notification-received', notif);
  }).catch(err => console.error('[Notification error]', err));
};

export const getReservations = async (req, res, next) => {
  try {
    const reservations = await Reservation.find({ customerId: req.user._id, status: 'Reserved' });
    // Manually populate since refs don't span multiple models
    const populated = await Promise.all(reservations.map(async r => {
      const p = await findProductById(r.productId, null);
      return { ...r.toObject(), productId: p };
    }));
    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

export const createReservation = async (req, res, next) => {

  try {
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity <= 0) {
      throw new Error('Valid Product ID and Quantity are required.');
    }

    const product = await findProductById(productId);
    if (!product) {
      throw new Error('Product not found.');
    }

    const moq = product.moq || 1;
    if (quantity % moq !== 0) {
      throw new Error(`Order quantity must be a multiple of the Minimum Order Quantity (${moq}).`);
    }

    if (product.availableForSale < quantity) {
      throw new Error(`Insufficient stock for product ${product.skuCode}. Available: ${product.availableForSale}`);
    }

    // MSIL Code Validation
    if (!product.msilCode) {
      throw new Error(`Product ${product.skuCode} does not have an MSIL Code assigned.`);
    }
    const msilDoc = await MsilCode.findOne({ code: product.msilCode });
    if (!msilDoc || msilDoc.status !== 'Active') {
      throw new Error(`MSIL Code ${product.msilCode} for product ${product.skuCode} is inactive or does not exist.`);
    }

    // Allocate inventory
    product.availableForSale -= quantity;
    product.bookedQuantity += quantity;
    await product.save();

    const reservationId = `RES-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const reservationDate = new Date();
    const expiryDate = new Date(reservationDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 Days

    const reservation = await Reservation.create([{
      reservationId,
      customerId: req.user._id,
      productId: product._id,
      skuCode: product.skuCode,
      msilCode: product.msilCode,
      quantity,
      reservationDate,
      expiryDate,
      status: 'Reserved',
      reservedBy: req.user._id
    }]);

    await logEvent(req.user, 'Reservation Created', `Reserved ${quantity} units of ${product.skuCode}`, req);
    sendNotification(req.user._id, 'Reservation Created', `Temporary 7-day reservation created for ${product.skuCode} (${quantity} units).`, 'reservation');

    res.status(201).json({ success: true, data: reservation[0] });
  } catch (error) {
    next(error);
  }
};

export const updateReservationQuantity = async (req, res, next) => {

  try {
    const { quantity } = req.body;
    if (!quantity || quantity <= 0) {
      throw new Error('Quantity must be greater than zero.');
    }

    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      throw new Error('Reservation not found.');
    }

    if (reservation.status !== 'Reserved') {
      throw new Error('Only active reservations can be edited.');
    }

    const product = await findProductById(reservation.productId);
    if (!product) {
      throw new Error('Product not found.');
    }

    const moq = product.moq || 1;
    if (quantity % moq !== 0) {
      throw new Error(`Order quantity must be a multiple of the Minimum Order Quantity (${moq}).`);
    }

    const diff = quantity - reservation.quantity;

    if (diff > 0 && product.availableForSale < diff) {
      throw new Error(`Insufficient stock to increase reservation. Available: ${product.availableForSale}`);
    }

    // Adjust inventory
    product.availableForSale -= diff;
    product.bookedQuantity += diff;
    await product.save();

    reservation.quantity = quantity;
    await reservation.save();

    await logEvent(req.user, 'Reservation Updated', `Adjusted quantity of reservation ${reservation.reservationId} to ${quantity}`, req);

    res.status(200).json({ success: true, data: reservation });
  } catch (error) {
    next(error);
  }
};

export const cancelReservation = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      throw new Error('Reservation not found.');
    }

    if (reservation.status !== 'Reserved') {
      throw new Error('Only active reservations can be cancelled.');
    }

    const product = await findProductById(reservation.productId);
    if (product) {
      product.availableForSale += reservation.quantity;
      product.bookedQuantity -= reservation.quantity;
      await product.save();
    }

    reservation.status = 'Cancelled';
    reservation.expiredAt = new Date();
    await reservation.save();

    await logEvent(req.user, 'Reservation Cancelled', `Cancelled reservation ${reservation.reservationId}`, req);
    sendNotification(req.user._id, 'Reservation Cancelled', `Reservation ${reservation.reservationId} has been cancelled and stock released.`, 'reservation');

    res.status(200).json({ success: true, data: reservation });
  } catch (error) {
    next(error);
  }
};

export const confirmBooking = async (req, res, next) => {
  try {
    const reservations = await Reservation.find({ customerId: req.user._id, status: 'Reserved' });
    if (reservations.length === 0) {
      throw new Error('No active reservations to confirm.');
    }

    const orderNumber = `SO-${new Date().getFullYear()}-${Math.floor(Math.random() * 100000).toString().padStart(6, '0')}`;
    const ordersToCreate = [];
    const dateNow = new Date();

    for (let resItem of reservations) {
      const product = await findProductById(resItem.productId);
      if (!product) {
        throw new Error(`Product ${resItem.skuCode} not found.`);
      }

      // Release reservation stock temporarily so createOrder doesn't complain of insufficient stock
      product.availableForSale += resItem.quantity;
      product.bookedQuantity -= resItem.quantity;
      await product.save();

      ordersToCreate.push({
        orderId: orderNumber,
        brand: product.brand || 'Koken',
        user: req.user._id,
        status: 'Booked', // Equivalent to 'Pending Approval' for the new schema
        orderTimestamp: dateNow,
        company: req.user.company || 'Shraddha Impex',
        role: req.user.role || 'user',
        date: dateNow,
        skuCode: product.skuCode,
        category: Array.isArray(product.category) ? product.category.join(', ') : (product.category || 'Unknown'),
        requestedQty: resItem.quantity,
        poNumber: req.body.poNumber || `BOOK-${Date.now()}`,
        remarks: req.body.remarks || 'Confirmed ERP reservation booking.',
        msilCode: product.msilCode || null,
        boxNo: product.boxNo || null,
        vendorCode: product.vendorCode || null,
        emailId: req.user.email || null,
        phoneNumber: req.user.phone || null
      });

      resItem.status = 'Confirmed';
      resItem.confirmedAt = dateNow;
      await resItem.save();

      await logEvent(req.user, 'Reservation Confirmed', `Confirmed reservation ${resItem.reservationId}`, req);
    }

    const order = await Order.insertMany(ordersToCreate);

    // Now re-adjust product stock from the created orders
    for (let orderDoc of order) {
      const product = await findProductById(reservations.find(r => r.skuCode === orderDoc.skuCode)?.productId);
      if (product) {
        product.availableForSale -= orderDoc.requestedQty;
        product.bookedQuantity += orderDoc.requestedQty;
        await product.save();
      }
    }

    sendNotification(req.user._id, 'Booking Confirmed', `Your reservation booking ${orderNumber} is confirmed and pending ERP approval.`, 'order');

    // Emit socket event
    io.emit('order-created', { orderId: order[0]._id, orderNumber });

    res.status(201).json({ success: true, data: order[0] });
  } catch (error) {
    next(error);
  }
};

export const validateBulk = async (req, res, next) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows)) {
      throw new Error('Rows must be an array.');
    }

    const validatedRows = [];

    for (let row of rows) {
      const errors = [];
      let status = 'valid';
      
      const skuCode = row.skuCode?.trim();
      const msilCode = row.msilCode?.trim();
      const quantity = Number(row.quantity) || 0;

      if (!skuCode && !msilCode) {
        errors.push("Missing both SKU and MSIL Code.");
        validatedRows.push({ ...row, status: 'error', errors });
        continue;
      }

      if (quantity <= 0) {
        errors.push("Quantity must be greater than zero.");
      }

      // Lookup product
      let product = null;
      if (skuCode) {
        product = await ProductKoken.findOne({ skuCode });
        if (!product) product = await ProductBIX.findOne({ skuCode });
        if (!product) product = await ProductIMADA.findOne({ skuCode });
      }
      
      if (!product && msilCode && !skuCode) {
        product = await ProductKoken.findOne({ msilCode });
        if (!product) product = await ProductBIX.findOne({ msilCode });
        if (!product) product = await ProductIMADA.findOne({ msilCode });
      }

      if (!product) {
        errors.push("Product not found in database.");
        validatedRows.push({ ...row, status: 'error', errors });
        continue;
      }

      // If both provided, verify match
      if (skuCode && msilCode) {
        if (product.msilCode !== msilCode) {
          errors.push(`Provided MSIL Code (${msilCode}) does not match Product MSIL Code (${product.msilCode}).`);
        }
      }

      // Check Stock
      if (product.availableForSale < quantity) {
        errors.push(`Insufficient stock. Available: ${product.availableForSale}`);
      }

      // Check MSIL Active
      const targetMsil = product.msilCode;
      if (!targetMsil) {
        errors.push(`Product ${product.skuCode} does not have an MSIL Code assigned.`);
      } else {
        const msilDoc = await MsilCode.findOne({ code: targetMsil });
        if (!msilDoc || msilDoc.status !== 'Active') {
          errors.push(`MSIL Code ${targetMsil} is inactive or does not exist.`);
        }
      }

      if (errors.length > 0) {
        status = 'error';
      }

      validatedRows.push({
        ...row,
        status,
        errors,
        product: product ? {
          id: product._id,
          code: product.skuCode,
          msilCode: product.msilCode,
          name: product.skuCode,
          category: product.category,
          availableStock: product.availableForSale,
          price: 0
        } : null
      });
    }

    res.status(200).json({ success: true, data: validatedRows });
  } catch (error) {
    next(error);
  }
};
