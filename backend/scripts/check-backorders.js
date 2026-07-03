// Diagnostic: verify the backorder flow against the real DB.
// Reproduces exactly what getPendingReservations + restoreBackorder rely on.
import 'dotenv/config';
import { MongoClient } from 'mongodb';

const URI = process.env.MONGODB_URI;

const findProduct = async (db, productId) => {
  for (const c of ['products_koken', 'products_bix', 'products_imada', 'products']) {
    const p = await db.collection(c).findOne({ _id: productId });
    if (p) return { p, collection: c };
  }
  return { p: null, collection: null };
};

const run = async () => {
  const client = new MongoClient(URI);
  await client.connect();
  const db = client.db();
  console.log(`[check] DB: ${db.databaseName}\n`);

  const resv = db.collection('reservations');

  // 1. Status breakdown of all reservations.
  const byStatus = await resv.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }, { $sort: { n: -1 } }]).toArray();
  console.log('Reservation status breakdown:');
  byStatus.forEach((s) => console.log(`  ${s._id || '(none)'}: ${s.n}`));

  // 2. Backorders exactly as getPendingReservations queries them.
  const backorders = await resv.find({ status: { $in: ['Pending', 'Partially Confirmed'] } }).toArray();
  console.log(`\nBackorders (Pending / Partially Confirmed): ${backorders.length}`);

  if (backorders.length === 0) {
    console.log('  -> No backorders exist yet. The page will correctly show "No pending backorders".');
  }

  // 3. For each backorder, validate the fields the restore flow needs.
  let issues = 0;
  for (const b of backorders.slice(0, 25)) {
    const { p, collection } = await findProduct(db, b.productId);
    const customer = b.customerId ? await db.collection('users').findOne({ _id: b.customerId }) : null;

    const problems = [];
    if (!p) problems.push('product NOT found in any brand collection');
    else if (typeof p.availableForSale !== 'number') problems.push(`product.availableForSale missing/NaN (=${p.availableForSale})`);
    if (!customer) problems.push('customer NOT found');
    else if (!customer.email) problems.push('customer.email missing (restore email will be skipped)');
    if (typeof b.quantity !== 'number' || b.quantity <= 0) problems.push(`quantity invalid (=${b.quantity})`);

    const stockOk = p && typeof p.availableForSale === 'number' ? p.availableForSale >= b.quantity : false;
    const restorable = problems.length === 0 && stockOk;

    if (problems.length) issues++;
    console.log(
      `\n  • ${b.reservationId} | ${b.skuCode} | qty ${b.quantity} | status ${b.status}` +
        `\n    product: ${p ? `${collection} availableForSale=${p.availableForSale}` : 'MISSING'}` +
        `\n    customer: ${customer ? `${customer.email || '(no email)'}` : 'MISSING'}` +
        `\n    restore now? ${restorable ? 'YES (stock sufficient)' : stockOk ? 'blocked by data issue' : 'NO — not enough stock yet'}` +
        (problems.length ? `\n    ISSUES: ${problems.join('; ')}` : ''),
    );
  }

  console.log(`\n[check] ${backorders.length} backorders scanned, ${issues} with data issues.`);
  await client.close();
};

run().catch((e) => {
  console.error('[check] FAILED:', e.message);
  process.exit(1);
});
