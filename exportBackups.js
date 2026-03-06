const { MongoClient } = require('mongodb');
const { EJSON } = require('bson');
const fs = require('fs');
const path = require('path');

const [,, mongoUri] = process.argv;
if (!mongoUri) {
  console.error('Usage: node exportBackups.js <mongodb-uri>');
  process.exit(1);
}

const BACKUP_DIR = path.join(process.cwd(), 'managerBackups');
// Read collections from environment variable if available, otherwise use default.

const defaultCollections = ["tickets", "operations", "users", "agentsoperations", "expenses", "airlines"];
const COLLECTIONS = process.env.COLLECTIONS ? process.env.COLLECTIONS.split(',') : defaultCollections;

async function exportData() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const client = new MongoClient(mongoUri);

  try {
    console.log('Starting Database Export...');
    console.log(`Connecting to database...`);
    await client.connect();
    const db = client.db(); // Use the database from the connection string
    console.log('Database connected successfully.');

    for (const collectionName of COLLECTIONS) {
      console.log(`Exporting collection: ${collectionName}...`);
      const collection = db.collection(collectionName);
      const documents = await collection.find({}).toArray();

      // The old API wrapped docs in a `documents` key. We'll do the same for compatibility.
      const dataToWrite = { documents: documents };

      const today = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${collectionName}_${today}.json`;
      const filePath = path.join(BACKUP_DIR, fileName);

      fs.writeFileSync(filePath, EJSON.stringify(dataToWrite, null, 2));
      console.log(`Saved ${documents.length} documents to ${fileName}`);
    }

    console.log('\n--- Export completed successfully! ---');
  } catch (e) {
    console.error('\n Export failed:', e);
    process.exit(1);
  } finally {
    await client.close();
    console.log('Database connection closed.');
  }
}

exportData();
