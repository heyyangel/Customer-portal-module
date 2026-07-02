import mongoose from 'mongoose';
import { ProductKoken, ProductBIX, ProductIMADA } from './models/Product.js';
import MsilCode from './models/MsilCode.js';
import dotenv from 'dotenv';
dotenv.config();

async function seedMsilCodes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/erp_portal');
    console.log('Connected to DB');

    const productsK = await ProductKoken.find({ msilCode: { $ne: null } }).lean();
    const productsB = await ProductBIX.find({ msilCode: { $ne: null } }).lean();
    const productsI = await ProductIMADA.find({ msilCode: { $ne: null } }).lean();

    const allProducts = [...productsK, ...productsB, ...productsI];
    
    // Extract unique non-empty MSIL codes
    const msilSet = new Set();
    allProducts.forEach(p => {
      if (p.msilCode && p.msilCode.trim() !== '') {
        msilSet.add(p.msilCode.trim());
      }
    });

    console.log(`Found ${msilSet.size} unique MSIL Codes from Products.`);

    const msilDocs = Array.from(msilSet).map(code => ({
      code,
      status: 'Active'
    }));

    // Insert ignoring duplicates (if any already exist)
    for (const doc of msilDocs) {
      await MsilCode.updateOne(
        { code: doc.code },
        { $setOnInsert: doc },
        { upsert: true }
      );
    }

    console.log('Successfully seeded MSIL Codes to Active.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedMsilCodes();
