import mongoose from 'mongoose';
import Reservation from '../../models/Reservation.js';
import { ProductKoken, ProductBIX, ProductIMADA } from '../../models/Product.js';
import Order from '../../models/Order.js';
import AuditLog from '../../models/AuditLog.js';
import MsilCode from '../../models/MsilCode.js';
import { nextSequence } from '../../models/Counter.js';
import { io } from '../../server.js';
import { sendEmail } from '../../utils/mailer.js';
import { notifyUser, notifyAdmins } from '../../utils/notify.js';

// The product collection is split one-per-brand; the brand is implied by which
// collection a doc lives in (there is no brand field on the schema).
const BRAND_MODELS = [
  [ProductKoken, 'Koken'],
  [ProductBIX, 'BIX'],
  [ProductIMADA, 'IMADA'],
];

// Helper to find product across all brands. Pass a session to read within a
// transaction so the stock value is consistent for the read-modify-write cycle.
const findProductById = async (productId, session = null) => {
  const opts = session ? { session } : {};
  for (const [Model] of BRAND_MODELS) {
    const p = await Model.findById(productId, null, opts);
    if (p) return p;
  }
  return null;
};

// Derive the brand from a live product doc's model (products_koken → 'Koken').
// The brand is not a schema field — it is implied by which collection it lives in.
const brandFromModel = (doc) => {
  const name = (doc?.constructor?.modelName || '').toLowerCase();
  if (name.includes('bix')) return 'BIX';
  if (name.includes('imada')) return 'IMADA';
  return 'Koken';
};

// Read-side lookup that also resolves the brand (derived from the collection).
// Returns a plain object so callers can safely spread extra fields onto it.
const findProductWithBrand = async (productId) => {
  for (const [Model, brand] of BRAND_MODELS) {
    const p = await Model.findById(productId);
    if (p) return { product: { ...p.toObject(), brand }, brand };
  }
  return { product: null, brand: null };
};

// Atomically fulfil as much of `wantQty` as live stock allows. Uses a guarded
// $inc so two concurrent confirmations can never oversell (drive stock < 0).
// Mutates product.availableForSale to the fresh post-decrement value and
// returns the quantity actually deducted (0..wantQty).
const deductStockAtomic = async (product, wantQty, session = null) => {
  const Model = product.constructor;
  const opts = session ? { session } : {};
  for (let attempt = 0; attempt < 5; attempt++) {
    const fresh = await Model.findById(product._id, null, opts);
    if (!fresh) return 0;
    const avail = Math.max(0, fresh.availableForSale);
    const take = Math.min(wantQty, avail);
    if (take === 0) {
      product.availableForSale = fresh.availableForSale;
      return 0;
    }
    const updated = await Model.findOneAndUpdate(
      { _id: product._id, availableForSale: { $gte: take } },
      { $inc: { availableForSale: -take, bookedQuantity: take } },
      { new: true, ...opts }
    );
    if (updated) {
      product.availableForSale = updated.availableForSale;
      return take;
    }
    // Stock changed underneath us between read and write — retry with fresh value.
  }
  return 0;
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

// Persist + deliver a notification to a single user (their own room only).
const sendNotification = (userId, title, message, type = 'reservation') => {
  notifyUser(userId, { title, message, type });
};

export const getReservations = async (req, res, next) => {
  try {
    const reservations = await Reservation.find({ customerId: req.user._id, status: 'Reserved' });
    // Manually populate since refs don't span multiple models
    const populated = await Promise.all(reservations.map(async r => {
      const { product } = await findProductWithBrand(r.productId);
      return { ...r.toObject(), productId: product };
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
      const { product } = await findProductWithBrand(r.productId);
      return { ...obj, productId: product };
    }));
    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// Admin action: when fresh stock arrives, a Pending backorder can be moved back
// into the customer's active selection list so they can re-confirm it. The
// customer is emailed and notified to go confirm it from their dashboard.
// Stock is NOT deducted here — that still happens at confirmation time. We only
// verify enough stock exists so the customer's confirmation will actually succeed.
export const restoreBackorder = async (req, res, next) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Only an admin can move a backorder to the selection list.' });
    }

    const reservation = await Reservation.findById(req.params.id).populate('customerId', 'user email company');
    if (!reservation) {
      throw new Error('Backorder not found.');
    }

    if (!['Pending', 'Partially Confirmed'].includes(reservation.status)) {
      throw new Error('Only pending backorders can be moved to the selection list.');
    }

    const product = await findProductById(reservation.productId);
    if (!product) {
      throw new Error(`Product ${reservation.skuCode} not found.`);
    }

    const available = Math.max(0, product.availableForSale);
    if (available < reservation.quantity) {
      throw new Error(
        `Not enough stock to restore this backorder. Requires ${reservation.quantity}, only ${available} available.`
      );
    }

    // Move it back into the active selection list with a fresh 7-day window.
    const now = new Date();
    reservation.status = 'Reserved';
    reservation.reservationDate = now;
    reservation.expiryDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    reservation.confirmedAt = undefined;
    reservation.expiredAt = undefined;
    reservation.lastReminderSent = null;
    await reservation.save();

    const customer = reservation.customerId || {};
    const customerName = customer.user || customer.company || 'Customer';

    await logEvent(
      req.user,
      'Backorder Restored',
      `Moved backorder ${reservation.reservationId} (${reservation.skuCode} x${reservation.quantity}) back to selection list.`,
      req
    );

    // Notify the customer in-app and by email.
    sendNotification(
      customer._id || reservation.customerId,
      'Backorder Back in Stock',
      `${reservation.skuCode} (${reservation.quantity} units) is back in stock and moved to your selection list. Confirm it from your dashboard.`,
      'reservation'
    );

    if (customer.email) {
      const subject = `Your backorder ${reservation.skuCode} is back in stock — confirm it now`;
      const body = `
        <p>Hi ${customerName},</p>
        <p>Good news! An item that was previously <strong>out of stock</strong> in your booking is now available again:</p>
        <table style="border-collapse: collapse; margin: 12px 0;">
          <tr><td style="padding: 4px 12px; color: #777;">SKU Code</td><td style="padding: 4px 12px; font-weight: bold;">${reservation.skuCode}</td></tr>
          <tr><td style="padding: 4px 12px; color: #777;">MSIL Code</td><td style="padding: 4px 12px; font-weight: bold;">${reservation.msilCode || '—'}</td></tr>
          <tr><td style="padding: 4px 12px; color: #777;">Quantity</td><td style="padding: 4px 12px; font-weight: bold;">${reservation.quantity}</td></tr>
          <tr><td style="padding: 4px 12px; color: #777;">Reference</td><td style="padding: 4px 12px; font-weight: bold;">${reservation.reservationId}</td></tr>
        </table>
        <p>It has been moved back to your <strong>selection list</strong>. Please log in to your dashboard and <strong>confirm this order</strong> to secure the stock. Note this selection will expire in 7 days if not confirmed.</p>
        <p>Thank you.</p>
      `;
      // Fire-and-forget: email failure should not fail the request.
      sendEmail(customer.email, subject, body).catch((e) =>
        console.error('[restoreBackorder] email error', e)
      );
    }

    io.emit('backorder-restored', { reservationId: reservation.reservationId });

    res.status(200).json({ success: true, data: reservation });
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

    const year = new Date().getFullYear();
    const seq = await nextSequence(`reservation-${year}`);
    const reservationId = `RES-${year}-${String(seq).padStart(6, '0')}`;
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
    const who = req.user.company || req.user.user || req.user.email;
    sendNotification(req.user._id, 'Item Booked', `${product.skuCode} (${quantity} units) added to your selection list. Confirm within 7 days — it is auto-cancelled after that.`, 'reservation');
    notifyAdmins({ title: 'New Booking', message: `${who} booked ${product.skuCode} (${quantity} units). It is now in their selection list.`, type: 'reservation' });

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
    sendNotification(req.user._id, 'Reservation Cancelled', `Reservation ${reservation.reservationId} has been cancelled and removed from your selection list.`, 'reservation');

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

  const year = new Date().getFullYear();
  const orderSeq = await nextSequence(`order-${year}`, session);
  const orderNumber = `SO-${year}-${String(orderSeq).padStart(6, '0')}`;
  const ordersToCreate = [];
  const summary = [];
  const dateNow = new Date();

  for (let resItem of reservations) {
    const product = await findProductById(resItem.productId, session);
    if (!product) {
      throw new Error(`Product ${resItem.skuCode} not found.`);
    }

    const requestedQty = resItem.quantity;

    // Fulfill as much as live stock allows (atomically, so concurrent
    // confirmations cannot oversell); the rest becomes a Pending backorder.
    const confirmedQty = await deductStockAtomic(product, requestedQty, session);
    const pendingQty = requestedQty - confirmedQty;

    if (confirmedQty > 0) {
      ordersToCreate.push({
        orderId: orderNumber,
        brand: brandFromModel(product),
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

    const who = req.user.company || req.user.user || req.user.email;
    notifyAdmins({
      title: totalPending > 0 ? 'Order Confirmed (with Backorder)' : 'Order Confirmed',
      message: `${who} confirmed booking ${orderNumber} — ${totalConfirmed} units confirmed${totalPending > 0 ? `, ${totalPending} units on backorder` : ''}.`,
      type: 'order',
    });

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
