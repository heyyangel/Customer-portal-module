import { ProductKoken, ProductBIX, ProductIMADA } from '../../models/Product.js';

// Map brand param → correct Mongoose model
const getModel = (brand) => {
  const b = String(brand || '').toLowerCase();
  if (b === 'koken')  return ProductKoken;
  if (b === 'bix')    return ProductBIX;
  if (b === 'imada')  return ProductIMADA;
  return null;
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
