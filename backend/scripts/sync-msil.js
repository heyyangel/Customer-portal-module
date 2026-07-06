import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ProductKoken from '../models/ProductKoken.js';
import ProductBIX from '../models/ProductBIX.js';
import ProductIMADA from '../models/ProductIMADA.js';
import MsilCode from '../models/MsilCode.js';

dotenv.config();

async function syncMsilCodes() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const msilSet = new Set();

  for (const Model of [ProductKoken, ProductBIX, ProductIMADA]) {
    const products = await Model.find({}, 'msilCode');
    products.forEach(p => {
      if (p.msilCode && p.msilCode.trim() !== '') msilSet.add(p.msilCode.trim());
    });
  }

  console.log('Found  unique MSIL codes. Syncing...');

  let inserted = 0;
  for (const code of msilSet) {
    const exists = await MsilCode.findOne({ code });
    if (!exists) {
      await MsilCode.create({ code, status: 'Active' });
      inserted++;
    }
  }

  console.log('Successfully inserted  missing MSIL codes!');
  process.exit(0);
}

syncMsilCodes().catch(err => {
  console.error(err);
  process.exit(1);
});