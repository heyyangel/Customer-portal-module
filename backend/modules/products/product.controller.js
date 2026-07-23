import { ProductKoken, ProductBIX, ProductIMADA } from '../../models/Product.js';

// Map brand param → correct Mongoose model
const getModel = (brand) => {
  const b = String(brand || '').toLowerCase();
  if (b === 'koken')  return ProductKoken;
  if (b === 'bix')    return ProductBIX;
  if (b === 'imada')  return ProductIMADA;
  return null;
};

// Sort keys accepted by the inventory view, mapped to Mongo sort specs.
// Products have no separate name column, so "name" sorts on skuCode.
const SORT_SPECS = {
  'name-asc':   { skuCode: 1 },
  'name-desc':  { skuCode: -1 },
  'stock-asc':  { availableForSale: 1 },
  'stock-desc': { availableForSale: -1 },
};

// A SKU is low stock below twice its MOQ, falling back to 10 when no MOQ is
// set. Mirrors the per-row badge threshold on the Inventory page.
const LOW_STOCK_MATCH = {
  $expr: {
    $lt: [
      '$availableForSale',
      { $cond: [{ $gt: ['$moq', 0] }, { $multiply: ['$moq', 2] }, 10] },
    ],
  },
};

// GET /api/v1/products?search=&sort=&page=&limit=
// The Inventory view spans all three brand collections. Search, sort, paging
// and the KPI counts all resolve server-side so they cover the whole catalogue
// rather than whatever subset the client happened to download.
export const getInventory = async (req, res, next) => {
  try {
    const { search, sort = 'name-asc' } = req.query;
    const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 200);
    const page = Math.max(Number(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;
    const sortSpec = SORT_SPECS[sort] || SORT_SPECS['name-asc'];

    // Export mode returns the whole filtered catalogue in one shot (no paging),
    // capped so a runaway request can't pull unbounded rows.
    const exportAll = ['true', '1'].includes(String(req.query.all));
    const EXPORT_CAP = 10000;
    const fetchLimit = exportAll ? EXPORT_CAP : skip + limit;

    // Low Stock is an Admin-only tile, and the $expr count cannot use an index,
    // so it is only run for the users who actually see it.
    const wantsLowStock = req.user?.role === 'Admin';

    // MSIL Codes are only searchable by users they are shown to — the same rule
    // as msilAppliesTo() in the reservations controller.
    const msilApplies =
      req.user?.role === 'Admin' ||
      req.user?.customerCategory === 'MSIL' ||
      req.user?.showMsilCode === true;

    const query = {};
    if (search) {
      query.$or = [{ skuCode: { $regex: search, $options: 'i' } }];
      if (msilApplies) query.$or.push({ msilCode: { $regex: search, $options: 'i' } });
    }

    // MSIL customers do not carry the IMADA brand, so it is excluded from their
    // Inventory entirely — rows, counts and low-stock all follow from this list.
    // Admins always see every brand.
    const isMsilCustomer =
      req.user?.role !== 'Admin' && req.user?.customerCategory === 'MSIL';
    const models = [
      [ProductKoken, 'KOKEN'],
      [ProductBIX, 'BIX'],
      ...(isMsilCustomer ? [] : [[ProductIMADA, 'IMADA']]),
    ];

    // Global ordering across the brand collections: take the first fetchLimit
    // of each, merge, re-sort, then slice the requested page out of the merge.
    // The globally first (skip + limit) rows are always contained in that union.
    const perModel = await Promise.all(
      models.map(async ([Model, brand]) => {
        const [rows, total, catalogue, lowStock] = await Promise.all([
          Model.find(query).sort(sortSpec).limit(fetchLimit).lean(),
          Model.countDocuments(query),
          // Without a search the filtered count is already the catalogue count.
          search ? Model.countDocuments() : Promise.resolve(null),
          wantsLowStock ? Model.countDocuments(LOW_STOCK_MATCH) : Promise.resolve(0),
        ]);
        return { rows: rows.map((r) => ({ ...r, brand })), total, catalogue, lowStock };
      }),
    );

    const [sortField, sortDir] = Object.entries(sortSpec)[0];
    const sorted = perModel
      .flatMap((m) => m.rows)
      .sort((a, b) => {
        const av = a[sortField];
        const bv = b[sortField];
        if (sortField === 'skuCode') {
          return String(av ?? '').localeCompare(String(bv ?? '')) * sortDir;
        }
        return ((av ?? 0) - (bv ?? 0)) * sortDir;
      });
    const merged = exportAll ? sorted : sorted.slice(skip, skip + limit);

    const total = perModel.reduce((sum, m) => sum + m.total, 0);

    res.status(200).json({
      success: true,
      data: merged,
      pagination: { total, page, pages: Math.ceil(total / limit) || 1 },
      // KPI tiles describe the whole catalogue, so they ignore the search filter.
      totals: {
        catalogue: perModel.reduce((sum, m) => sum + (m.catalogue ?? m.total), 0),
        lowStock: perModel.reduce((sum, m) => sum + m.lowStock, 0),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/products/:brand?search=&category=&page=&limit=
export const getProducts = async (req, res, next) => {
  try {
    const { brand } = req.params;
    const { search, category, limit = 50, page = 1 } = req.query;
    const Model = getModel(brand);

    if (!Model) {
      return res.status(400).json({ success: false, message: `Unknown brand: ${brand}` });
    }

    const query = {};
    if (search) {
      query.$or = [
        { skuCode: { $regex: search, $options: 'i' } },
        { msilCode: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) query.category = category;

    const [products, total] = await Promise.all([
      Model.find(query).limit(Number(limit)).skip((Number(page) - 1) * Number(limit)),
      Model.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: products,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/products/:brand/:skuCode
export const getProductByCode = async (req, res, next) => {
  try {
    const { brand, skuCode } = req.params;
    const Model = getModel(brand);

    if (!Model) {
      return res.status(400).json({ success: false, message: `Unknown brand: ${brand}` });
    }

    const product = await Model.findOne({
      $or: [{ skuCode: req.params.skuCode }, { msilCode: req.params.skuCode }]
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/products/:brand — used internally / admin
export const createProduct = async (req, res, next) => {
  try {
    const { brand } = req.params;
    const Model = getModel(brand);

    if (!Model) {
      return res.status(400).json({ success: false, message: `Unknown brand: ${brand}` });
    }

    const product = await Model.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};
