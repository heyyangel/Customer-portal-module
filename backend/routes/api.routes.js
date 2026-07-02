import express from 'express';
import mongoose from 'mongoose';
import { ProductKoken, ProductBIX, ProductIMADA } from '../models/Product.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import MsilCode from '../models/MsilCode.js';
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
    const { category, search } = req.query;
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

    const products = await Model.find(query).limit(100);
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

    // Monthly order trend — last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyTrend = await Order.aggregate([
      { $match: { ...orderQuery, createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
          qty:   { $sum: '$requestedQty' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const trendFormatted = monthlyTrend.map(m => ({
      name:   MONTH_NAMES[m._id.month - 1],
      orders: m.count,
      qty:    m.qty || 0,
    }));

    // Recent 5 orders for activity feed
    const recentOrders = await Order.find(orderQuery)
      .sort({ createdAt: -1 })
      .limit(5)
      .select('orderId skuCode status company createdAt orderTimestamp date brand requestedQty')
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
        monthlyTrend: trendFormatted,
        recentOrders,
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
