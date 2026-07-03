import mongoose from 'mongoose';
import Reservation from '../../models/Reservation.js';
import { ProductKoken, ProductBIX, ProductIMADA } from '../../models/Product.js';
import Order from '../../models/Order.js';
import AuditLog from '../../models/AuditLog.js';
import Notification from '../../models/Notification.js';
import MsilCode from '../../models/MsilCode.js';
import { io } from '../../server.js';

// Helper to find product across all brands. Pass a session to read within a
// transaction so the stock value is consistent for the read-modify-write cycle.
const findProductById = async (productId, session = null) => {
  const opts = session ? { session } : {};
  let p = await ProductKoken.findById(productId, null, opts);
  if (p) return p;
  p = await ProductBIX.findById(productId, null, opts);
  if (p) return p;
  p = await ProductIMADA.findById(productId, null, opts);
  return p;
};

// Detects the "transactions not supported" error thrown by a standalone
// (non-replica-set) MongoDB, so we can gracefully fall back to a non-transactional run.
const isTransactionUnsupported = (err) => {
  if (!err) return false;
  const msg = err.message || '';
  return (
    err.code === 20 || // IllegalOperation
    err.codeName === 'IllegalOperation' ||
    /Transaction numbers are only allowed on a replica set member or mongos/i.test(msg) ||
    /Transactions are not supported/i.test(msg)
  );
};

// Helper to create audit logs
const logEvent = async (user, action, remarks, req, session = null) => {
  try {
    await AuditLog.create([{
      user: user._id,
      action: action,
      method: req?.method || 'SYSTEM',
      endpoint: req?.originalUrl || 'N/A',
      ipAddress: req?.ip || '127.0.0.1',
      userAgent: req?.headers?.['user-agent'] || 'ERP SYSTEM',
      remarks: remarks // If schema has remarks
    }], session ? { session } : {});
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

// Backorders: quantities that could not be fulfilled at confirmation time.
// Admins see backorders across all customers; customers see only their own.
export const getPendingReservations = async (req, res, next) => {
  try {
    const filter = { status: { $in: ['Pending', 'Partially Confirmed'] } };
    if (req.user.role !== 'Admin') {
      filter.customerId = req.user._id;
    }

    const reservations = await Reservation.find(filter)
      .populate('customerId', 'name email company')
      .sort({ updatedAt: -1 });

    const populated = await Promise.all(reservations.map(async r => {
      const obj = r.toObject();
      const p = await findProductById(r.productId, null);
      return { ...obj, productId: p };
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

    // NOTE: Stock availability is intentionally NOT validated here. Customers may
    // book any quantity, even beyond availableForSale. Stock is only checked and
    // deducted at confirmation time (see confirmBooking), where any unfulfillable
    // quantity is moved to a Pending backorder.

    // MSIL Code Validation
    if (!product.msilCode) {
      throw new Error(`Product ${product.skuCode} does not have an MSIL Code assigned.`);
    }
    const msilDoc = await MsilCode.findOne({ code: product.msilCode });
    if (!msilDoc || msilDoc.status !== 'Active') {
      throw new Error(`MSIL Code ${product.msilCode} for product ${product.skuCode} is inactive or does not exist.`);
    }

    // Stock is NOT allocated/deducted at booking time — only at confirmation.

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

    // No stock validation/adjustment — stock is only allocated at confirmation time.
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

    // No stock was allocated at booking time, so there is nothing to release.
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

// Core confirmation logic. All DB writes accept an optional `session` so the
// whole read-modify-write cycle (stock deduction + order creation + reservation
// updates) is atomic when transactions are available.
const runConfirmBooking = async (req, session) => {
  const reservations = await Reservation.find(
    { customerId: req.user._id, status: 'Reserved' },
    null,
    session ? { session } : {}
  );
  if (reservations.length === 0) {
    throw new Error('No active reservations to confirm.');
  }

  const orderNumber = `SO-${new Date().getFullYear()}-${Math.floor(Math.random() * 100000).toString().padStart(6, '0')}`;
  const ordersToCreate = [];
  const summary = [];
  const dateNow = new Date();

  for (let resItem of reservations) {
    const product = await findProductById(resItem.productId, session);
    if (!product) {
      throw new Error(`Product ${resItem.skuCode} not found.`);
    }

    const requestedQty = resItem.quantity;
    const available = Math.max(0, product.availableForSale);

    // Fulfill as much as stock allows; the rest becomes a Pending backorder.
    const confirmedQty = Math.min(requestedQty, available);
    const pendingQty = requestedQty - confirmedQty;

    // Deduct only the confirmed portion from live stock.
    if (confirmedQty > 0) {
      product.availableForSale -= confirmedQty;
      product.bookedQuantity += confirmedQty;
      await product.save({ session });

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
        requestedQty: confirmedQty, // kept = confirmedQty for back-compat
        bookedQty: requestedQty,    // what the customer originally booked
        confirmedQty,               // what was actually fulfilled from stock
        pendingQty,                 // unfulfilled remainder (backorder)
        poNumber: req.body.poNumber || `BOOK-${Date.now()}`,
        remarks: pendingQty > 0
          ? `Partially confirmed (${confirmedQty}/${requestedQty}). ${pendingQty} moved to Pending backorder. ${req.body.remarks || ''}`.trim()
          : (req.body.remarks || 'Confirmed ERP reservation booking.'),
        msilCode: product.msilCode || null,
        boxNo: product.boxNo || null,
        vendorCode: product.vendorCode || null,
        emailId: req.user.email || null,
        phoneNumber: req.user.phone || null
      });
    }

    // Update the reservation to reflect what actually happened.
    if (pendingQty === 0) {
      // Fully fulfilled.
      resItem.status = 'Confirmed';
      resItem.confirmedAt = dateNow;
      resItem.quantity = confirmedQty;
    } else {
      // Some (or all) of the quantity could not be fulfilled — keep the
      // unfulfilled remainder as a Pending backorder reservation.
      resItem.status = confirmedQty > 0 ? 'Partially Confirmed' : 'Pending';
      resItem.quantity = pendingQty;
      if (confirmedQty > 0) resItem.confirmedAt = dateNow;
    }
    await resItem.save({ session });

    await logEvent(
      req.user,
      'Reservation Confirmed',
      `Reservation ${resItem.reservationId}: confirmed ${confirmedQty}, pending ${pendingQty} (requested ${requestedQty})`,
      req,
      session
    );

    summary.push({
      reservationId: resItem.reservationId,
      skuCode: product.skuCode,
      msilCode: product.msilCode || null,
      requestedQty,
      confirmedQty,
      pendingQty,
      availableStockAfter: product.availableForSale
    });
  }

  const createdOrders = ordersToCreate.length
    ? await Order.insertMany(ordersToCreate, session ? { session } : {})
    : [];

  const totalConfirmed = summary.reduce((sum, s) => sum + s.confirmedQty, 0);
  const totalPending = summary.reduce((sum, s) => sum + s.pendingQty, 0);

  return { orderNumber, createdOrders, summary, totalConfirmed, totalPending };
};

export const confirmBooking = async (req, res, next) => {
  const session = await mongoose.startSession();
  let result;
  try {
    try {
      // Preferred path: run everything inside a single ACID transaction.
      session.startTransaction();
      result = await runConfirmBooking(req, session);
      await session.commitTransaction();
    } catch (txErr) {
      await session.abortTransaction();
      if (isTransactionUnsupported(txErr)) {
        // Standalone MongoDB (no replica set) — transactions unavailable.
        // Nothing was committed, so it's safe to re-run without a session.
        console.warn('[confirmBooking] Transactions unsupported — running without a transaction.');
        result = await runConfirmBooking(req, null);
      } else {
        throw txErr;
      }
    } finally {
      session.endSession();
    }

    const { orderNumber, createdOrders, summary, totalConfirmed, totalPending } = result;

    // Side effects run only after a successful commit.
    const notifMessage = totalPending > 0
      ? `Booking ${orderNumber}: ${totalConfirmed} units confirmed, ${totalPending} units moved to Pending (backorder).`
      : `Your reservation booking ${orderNumber} is confirmed and pending ERP approval.`;
    sendNotification(req.user._id, 'Booking Confirmed', notifMessage, 'order');

    if (createdOrders.length) {
      io.emit('order-created', { orderId: createdOrders[0]._id, orderNumber });
    }

    res.status(201).json({
      success: true,
      data: {
        orderId: orderNumber,
        order: createdOrders[0] || null,
        orders: createdOrders,
        summary,
        totals: {
          totalRequested: totalConfirmed + totalPending,
          totalConfirmed,
          totalPending
        },
        fullyConfirmed: totalPending === 0
      }
    });
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
      const warnings = [];
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

      // Check Stock — no longer a hard error. Over-booking is allowed; any
      // shortfall becomes a Pending backorder at confirmation time.
      if (product.availableForSale < quantity) {
        const shortfall = quantity - Math.max(0, product.availableForSale);
        warnings.push(`Only ${Math.max(0, product.availableForSale)} in stock. ${shortfall} unit(s) will go to Pending.`);
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
      } else if (warnings.length > 0) {
        status = 'warning';
      }

      validatedRows.push({
        ...row,
        status,
        errors,
        warnings,
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
