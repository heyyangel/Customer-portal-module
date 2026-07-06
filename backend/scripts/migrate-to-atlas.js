import { MongoClient } from 'mongodb';

const SOURCE_URI = process.env.SOURCE_URI || 'mongodb://localhost:27017/erp_portal';
const DEST_URI = process.argv[2] || process.env.DEST_URI;

if (!DEST_URI) {
  console.error('\n[migrate] Missing destination Atlas URI.');
  console.error('Usage: node scripts/migrate-to-atlas.js "mongodb+srv://user:pass@cluster0.xxxx.mongodb.net/erp_portal?appName=Cluster0"\n');
  process.exit(1);
}

const destDbInPath = /mongodb(\+srv)?:\/\/[^/]+\/([^/?]+)/.exec(DEST_URI)?.[2];
if (!destDbInPath) {
  console.error('\n[migrate] The Atlas URI has no database name. Add /erp_portal before the "?":');
  console.error('  ...mongodb.net/erp_portal?appName=Cluster0\n');
  process.exit(1);
}

const run = async () => {
  const src = new MongoClient(SOURCE_URI);
  const dest = new MongoClient(DEST_URI);

  try {
    await src.connect();
    await dest.connect();

    const srcDb = src.db(); 
    const destDb = dest.db();

    console.log(`[migrate] Source: ${srcDb.databaseName} @ localhost`);
    console.log(`[migrate] Destination: ${destDb.databaseName} @ Atlas\n`);

    const collections = await srcDb.listCollections().toArray();
    const dataCollections = collections.filter((c) => c.type === 'collection' && !c.name.startsWith('system.'));

    if (dataCollections.length === 0) {
      console.log('[migrate] No collections found in the local database. Nothing to copy.');
      return;
    }

    let grandTotal = 0;
    for (const { name } of dataCollections) {
      const docs = await srcDb.collection(name).find({}).toArray();
      if (docs.length === 0) {
        console.log(`  - ${name}: 0 docs (skipped)`);
        continue;
      }

      // Upsert by _id so re-running is idempotent (no duplicates).
      const ops = docs.map((doc) => ({
        replaceOne: { filter: { _id: doc._id }, replacement: doc, upsert: true },
      }));

      const res = await destDb.collection(name).bulkWrite(ops, { ordered: false });
      const written = (res.upsertedCount || 0) + (res.modifiedCount || 0) + (res.matchedCount || 0);
      grandTotal += docs.length;
      console.log(`  - ${name}: ${docs.length} docs → upserted ${res.upsertedCount || 0}, updated ${res.modifiedCount || 0}`);
    }

    console.log(`\n[migrate] Done. ${grandTotal} documents copied across ${dataCollections.length} collections.`);
  } catch (err) {
    console.error('\n[migrate] FAILED:', err.message);
    process.exitCode = 1;
  } finally {
    await src.close().catch(() => {});
    await dest.close().catch(() => {});
  }
};

run();