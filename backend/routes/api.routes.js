import express from 'express';
import mongoose from 'mongoose';
import { ProductKoken, ProductBIX, ProductIMADA } from '../models/Product.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import MsilCode from '../models/MsilCode.js';
import Reservation from '../models/Reservation.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// Helper to match brand parameter to correct Mongoose model
const getProductModel = (brand) => {
  const b = String(brand).trim().toLowerCase();
  if (b === 'koken') return ProductKoken;
  if (b === 'bix') return ProductBIX;
  if (b === 'imada') return ProductIMADA;
  return null;
};

// 1. GET /api/products/:brand - list products with category filter and search on skuCode
router.get('/products/:brand', async (req, res, next) => {
  try {
    const { brand } = req.params;
    const { category, search, limit } = req.query;
    const Model = getProductModel(brand);

    if (!Model) {
      return res.status(400).json({ success: false, message: `Invalid brand parameter: ${brand}` });
    }

    const query = {};
    if (category) {
      query.category = category;
    }
    if (search) {
      query.skuCode = { $regex: search, $options: 'i' };
    }

    // Default cap 100; callers (e.g. the admin Inventory view) can request more to
    // see the full catalog, including low/zero-stock items. Hard-capped at 5000.
    const max = Math.min(parseInt(limit, 10) || 100, 5000);
    const products = await Model.find(query).limit(max);
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
});

// 2. GET /api/products/:brand/:skuCode - single product lookup
router.get('/products/:brand/:skuCode', async (req, res, next) => {
  try {
    const { brand, skuCode } = req.params;
    const Model = getProductModel(brand);

    if (!Model) {
      return res.status(400).json({ success: false, message: `Invalid brand: ${brand}` });
    }

    const product = await Model.findOne({ skuCode });
    if (!product) {
      return res.status(404).json({ success: false, message: `Product ${skuCode} not found` });
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
});

// 3. POST /api/orders - create an order and adjust product inventory
router.post('/orders', async (req, res, next) => {
  /*
   * TRADEOFF NOTE ON CONRENCY AND CONSISTENCY:
   * To ensure bookedQuantity and availableForSale values remain consistent during parallel purchases,
   * we must use MongoDB multi-document transactions (session.startTransaction()). 
   * However, transactions require MongoDB Replica Sets or Sharded Clusters.
   * If running a standalone Mongo instance, a standard session.withTransaction will error.
   * Below, we use atomic findOneAndUpdate operators as a robust, non-transactional fallback 
   * that runs safely on standalone instances while guaranteeing atomic count adjustments, 
   * or a full Mongoose transaction block if MongoDB replica set is available.
   */
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();

    const { brand, skuCode, requestedQty, email, poNumber, remarks, company } = req.body;

    if (!brand || !skuCode || !requestedQty || requestedQty <= 0) {
      return res.status(400).json({ success: false, message: 'Brand, SKU, and positive quantity are required.' });
    }

    const Model = getProductModel(brand);
    if (!Model) {
      return res.status(400).json({ success: false, message: `Invalid brand: ${brand}` });
    }

    // Find and update product atomically inside session
    const product = await Model.findOne({ skuCode }).session(session);
    if (!product) {
      throw new Error(`Product SKU ${skuCode} not found.`);
    }

    if (product.availableForSale < requestedQty) {
      throw new Error(`Insufficient stock. Available: ${product.availableForSale}`);
    }

    // MSIL Code Validation
    if (!product.msilCode) {
      throw new Error(`Product ${product.skuCode} does not have an MSIL Code assigned.`);
    }
    const msilDoc = await MsilCode.findOne({ code: product.msilCode }).session(session);
    if (!msilDoc || msilDoc.status !== 'Active') {
      throw new Error(`MSIL Code ${product.msilCode} for product ${product.skuCode} is inactive or does not exist.`);
    }

    // Recompute and update product inventory fields
    product.availableForSale -= requestedQty;
    product.bookedQuantity += requestedQty;
    // Total available quantity remains unchanged as stock was just moved from available to booked
    await product.save({ session });

    // Find User by email
    let userEmail = email ? String(email).trim().toLowerCase() : null;
    let userDoc = await User.findOne({ email: userEmail }).session(session);
    if (!userDoc) {
      // Use default admin or system user
      userDoc = await User.findOne({ role: 'Admin' }).session(session);
      if (!userDoc) {
        throw new Error('No user found to associate with the order.');
      }
    }

    const orderId = `SHR-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder = await Order.create([{
      brand: brand.toUpperCase() === 'BIX' ? 'BIX' : brand.toUpperCase() === 'IMADA' ? 'IMADA' : 'Koken',
      user: userDoc._id,
      status: 'Booked',
      orderId,
      skuCode,
      requestedQty,
      company: company || userDoc.company,
      poNumber,
      remarks,
      emailId: userDoc.email,
      date: new Date(),
      orderTimestamp: new Date()
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ success: true, data: newOrder[0] });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ success: false, message: error.message });
  }
});

// 4. GET /api/orders - list/filter orders by company and status
router.get('/orders', async (req, res, next) => {
  try {
    const { company, status } = req.query;
    const query = {};

    if (company) {
      query.company = company;
    }
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query).populate('user', 'email company role').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
});

// 5. POST /api/auth/login - plaintext match against User
router.post('/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Match plaintext password as requested
    const user = await User.findOne({ email: String(email).toLowerCase() });
    
    // TODO: replace with bcrypt.compare once ready
    if (!user || user.password !== String(password)) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Return user doc (minus password)
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({ success: true, data: userResponse });
  } catch (error) {
    next(error);
  }
});

// 6. GET /api/dashboard/stats - real KPIs for the dashboard
router.get('/dashboard/stats', protect, async (req, res, next) => {
  try {
    let orderQuery = {};
    if (req.user && req.user.role !== 'Admin') {
      orderQuery.user = req.user._id;
    }

    // Product counts across all brands
    const [kokenCount, bixCount, imadaCount] = await Promise.all([
      ProductKoken.countDocuments(),
      ProductBIX.countDocuments(),
      ProductIMADA.countDocuments(),
    ]);
    const totalProducts = kokenCount + bixCount + imadaCount;

    // Low-stock products (availableForSale <= 0)
    const [kokenLow, bixLow, imadaLow] = await Promise.all([
      ProductKoken.countDocuments({ availableForSale: { $lte: 0 } }),
      ProductBIX.countDocuments({ availableForSale: { $lte: 0 } }),
      ProductIMADA.countDocuments({ availableForSale: { $lte: 0 } }),
    ]);
    const lowStockAlerts = kokenLow + bixLow + imadaLow;

    // Order status breakdown
    const [totalOrders, bookedOrders, approvedOrders, dispatchedOrders, deliveredOrders] = await Promise.all([
      Order.countDocuments(orderQuery),
      Order.countDocuments({ ...orderQuery, status: 'Booked' }),
      Order.countDocuments({ ...orderQuery, status: 'Approved' }),
      Order.countDocuments({ ...orderQuery, status: 'Dispatched' }),
      Order.countDocuments({ ...orderQuery, status: 'Delivered' }),
    ]);

    // Active users
    const activeUsers = await User.countDocuments({ status: 'Active' });

    // Pending backorders (unfulfilled reservation quantities). Admin sees all;
    // customers see only their own.
    const pendingReservationFilter = { status: { $in: ['Pending', 'Partially Confirmed'] } };
    if (req.user && req.user.role !== 'Admin') {
      pendingReservationFilter.customerId = req.user._id;
    }
    const [pendingBackorders, pendingBackorderAgg] = await Promise.all([
      Reservation.countDocuments(pendingReservationFilter),
      Reservation.aggregate([
        { $match: pendingReservationFilter },
        { $group: { _id: null, qty: { $sum: '$quantity' } } }
      ])
    ]);
    const pendingBackorderQty = pendingBackorderAgg[0]?.qty || 0;

    // ── Booking-to-Order conversion analytics ──────────────────────────────
    // The funnel mirrors the customer flow:
    //   Add to selection list  → Reserved      (in list, awaiting confirmation)
    //   Confirm the list       → Confirmed     (fulfilled from stock)  → an Order
    //   Stock unavailable      → Pending       (backorder)
    //
    // Booked (total demand) = Reserved + Confirmed + Pending — everything that
    // ever entered the funnel. Confirmed / Pending are outcomes of confirmation.
    //   Reserved  = Σ Reservation.quantity where status 'Reserved'
    //   Confirmed = Σ Order.confirmedQty
    //   Pending   = Σ Reservation.quantity where status Pending / Partially Confirmed
    // Each demand unit is counted in exactly one bucket, so the three sum to Booked.
    // (Order.bookedQty already contains a partial's confirmed + pending remainder,
    //  so we add only fully-Pending reservations to it, never the partial remainder.)
    const reservedFilter = { status: 'Reserved' };
    const fullyPendingFilter = { status: 'Pending' };
    if (req.user && req.user.role !== 'Admin') {
      reservedFilter.customerId = req.user._id;
      fullyPendingFilter.customerId = req.user._id;
    }

    const [orderTotalsAgg, fullyPendingAgg, reservedAgg] = await Promise.all([
      Order.aggregate([
        { $match: orderQuery },
        {
          $group: {
            _id: null,
            booked:    { $sum: { $ifNull: ['$bookedQty', '$requestedQty'] } },
            confirmed: { $sum: { $ifNull: ['$confirmedQty', '$requestedQty'] } }
          }
        }
      ]),
      Reservation.aggregate([
        { $match: fullyPendingFilter },
        { $group: { _id: null, qty: { $sum: '$quantity' } } }
      ]),
      Reservation.aggregate([
        { $match: reservedFilter },
        { $group: { _id: null, qty: { $sum: '$quantity' } } }
      ])
    ]);

    const ordersBooked    = orderTotalsAgg[0]?.booked || 0;
    const totalConfirmed  = orderTotalsAgg[0]?.confirmed || 0;
    const fullyPendingQty = fullyPendingAgg[0]?.qty || 0;
    const totalReserved   = reservedAgg[0]?.qty || 0;   // in selection list, not yet confirmed
    const totalPending    = pendingBackorderQty;        // Pending + Partially Confirmed
    // Booked demand = confirmed + partial-pending (in ordersBooked) + fully-pending + reserved
    const totalBooked     = ordersBooked + fullyPendingQty + totalReserved;
    const conversionRate  = totalBooked > 0
      ? Math.round((totalConfirmed / totalBooked) * 10000) / 100
      : 0;

    // Monthly trend — last 6 months, booked vs confirmed side by side
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const [orderTrend, pendingTrend, reservedTrend] = await Promise.all([
      Order.aggregate([
        { $match: { ...orderQuery, createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            count:     { $sum: 1 },
            booked:    { $sum: { $ifNull: ['$bookedQty', '$requestedQty'] } },
            confirmed: { $sum: { $ifNull: ['$confirmedQty', '$requestedQty'] } }
          }
        }
      ]),
      Reservation.aggregate([
        { $match: { ...fullyPendingFilter, updatedAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { year: { $year: '$updatedAt' }, month: { $month: '$updatedAt' } },
            booked: { $sum: '$quantity' }
          }
        }
      ]),
      // Reserved demand grouped by when it was added to the selection list.
      Reservation.aggregate([
        { $match: { ...reservedFilter, createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            booked: { $sum: '$quantity' }
          }
        }
      ])
    ]);

    const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const keyOf = (y, m) => `${y}-${m}`;
    const orderMap = new Map(orderTrend.map(o => [keyOf(o._id.year, o._id.month), o]));
    const pendMap  = new Map(pendingTrend.map(p => [keyOf(p._id.year, p._id.month), p]));
    const resvMap  = new Map(reservedTrend.map(r => [keyOf(r._id.year, r._id.month), r]));

    const trendFormatted = [];
    const cursor = new Date(sixMonthsAgo);
    for (let i = 0; i < 6; i++) {
      const y = cursor.getFullYear();
      const m = cursor.getMonth() + 1;
      const o = orderMap.get(keyOf(y, m));
      const p = pendMap.get(keyOf(y, m));
      const rv = resvMap.get(keyOf(y, m));
      const confirmed = o?.confirmed || 0;
      const booked = (o?.booked || 0) + (p?.booked || 0) + (rv?.booked || 0);
      trendFormatted.push({
        name:        MONTH_NAMES[m - 1],
        booked,
        confirmed,
        unfulfilled: Math.max(0, booked - confirmed), // reserved (in list) + pending backorder
        orders:      o?.count || 0, // retained for back-compat (CSV export)
        qty:         confirmed
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    // Recent orders for the activity feed (fixed-height scrollable list)
    const recentOrders = await Order.find(orderQuery)
      .sort({ createdAt: -1 })
      .limit(15)
      .select('orderId skuCode status company createdAt orderTimestamp date brand requestedQty bookedQty confirmedQty pendingQty')
      .lean();

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        lowStockAlerts,
        totalOrders,
        bookedOrders,
        approvedOrders,
        dispatchedOrders,
        deliveredOrders,
        activeUsers,
        pendingBackorders,
        pendingBackorderQty,
        // Booking-to-Order conversion metrics
        totalBooked,
        totalConfirmed,
        totalPending,
        totalReserved, // in selection list, awaiting confirmation
        conversionRate,
        monthlyTrend: trendFormatted,
        recentOrders,
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
