import mongoose from 'mongoose';
import { ProductKoken } from './models/Product.js';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/erp_portal');
  const product = await ProductKoken.findOne({ skuCode: '14405M-10' });
  console.log('MsilCode:', product.msilCode);
  process.exit(0);
}
test();
