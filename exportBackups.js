const { MongoClient } = require('mongodb');
const { EJSON } = require('bson');
const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.join(process.cwd(), 'managerBackups');
// Read collections from environment variable if available, otherwise use default.

const defaultCollections = ["tickets", "operations", "users", "agentsoperations", "expenses", "airlines"];
const COLLECTIONS = process.env.COLLECTIONS ? process.env.COLLECTIONS.split(',') : defaultCollections;

async function getCollections(mongoUri) {
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db();
    const result = {};

    for (const collectionName of COLLECTIONS) {
      const collection = db.collection(collectionName);
      const documents = await collection.find({}).toArray();
      result[`${collectionName}.json`] = EJSON.stringify({ documents: documents }, null, 2);
    }

    return result;
  } finally {
    await client.close();
  }
}

async function exportData(mongoUri) {
  if (!mongoUri) {
    console.error('Usage: node exportBackups.js <mongodb-uri>');
    process.exit(1);
  }

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  console.log('Starting Database Export...');
  console.log(`Connecting to database...`);

  try {
    const collections = await getCollections(mongoUri);
    console.log('Database connected successfully.');

    const today = new Date().toISOString().replace(/[:.]/g, '-');
    for (const [fileName, content] of Object.entries(collections)) {
      const filePath = path.join(BACKUP_DIR, `${fileName.replace('.json', `_${today}.json`)}`);
      fs.writeFileSync(filePath, content);
      console.log(`Saved ${fileName} to ${filePath}`);
    }

    console.log('\n--- Export completed successfully! ---');
  } catch (e) {
    console.error('\n Export failed:', e);
    process.exit(1);
  }
}

if (require.main === module) {
  const mongoUri = process.argv[2];
  exportData(mongoUri);
}

module.exports = {
  exportData,
  getCollections,
};
