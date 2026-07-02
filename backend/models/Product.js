import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  skuCode: { type: String, required: true, unique: true },
  msilCode: { type: String, default: null },
  category: { type: [String], default: [] },
  itemParameter: { type: String, default: null },
  dailyAvgConsumption: {
    low: { type: Number, default: 0 },
    normal: { type: Number, default: 0 },
    peak: { type: Number, default: 0 }
  },
  currentSeason: { type: String, default: null },
  leadTime: { type: Number, default: 0 },
  safetyFactor: { type: Number, default: 0 },
  maxLevel: { type: Number, default: 0 },
  openingStockQuantity: { type: Number, default: null },
  totalAvailableQuantity: { type: Number, default: 0 },
  availableInPercent: { type: Number, default: 0 },
  openingStockDate: { type: Date, default: null },
  bookedQuantity: { type: Number, default: 0 },
  availableForSale: { type: Number, default: 0 },
  moq: { type: Number, default: 0 },
  boxNo: { type: String, default: null },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Discontinued'],
    default: 'Active'
  },
  inTransitQty: { type: Number, default: 0 },
  vendorName: { type: String, default: null }
}, { timestamps: true });

productSchema.index({ category: 1 });

export const createProductModel = (brand) => {
  const collectionName = `products_${brand.toLowerCase()}`;
  const modelName = `Product_${brand.toLowerCase()}`;
  
  // If the model already exists on mongoose, return it to avoid OverwriteModelError
  if (mongoose.models[modelName]) {
    return mongoose.models[modelName];
  }
  
  return mongoose.model(modelName, productSchema, collectionName);
};

export const ProductKoken = createProductModel('koken');
export const ProductBIX = createProductModel('bix');
export const ProductIMADA = createProductModel('imada');
export default productSchema;
