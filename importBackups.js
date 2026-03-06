const { MongoClient } = require('mongodb');
const { EJSON } = require('bson');
const fs = require('fs');
const path = require('path');

const [,, mongoUri] = process.argv;
if (!mongoUri) {
  console.error('Usage: node importBackups.js <mongodb-uri>');
  process.exit(1);
}
const BACKUP_DIR = path.join(process.cwd(), 'managerBackups');

async function importBackups() {
  console.log('Starting Database Import...');
  console.log(`Connecting to database...`);
  const files = fs.readdirSync(BACKUP_DIR).filter(f => f.endsWith('.json'));
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db(); // Uses db name from URI
    console.log('Database connected successfully.');

    for (const file of files) {
      const baseName = path.basename(file, '.json');
      const collectionName = baseName.includes('_') ? baseName.split('_')[0] : baseName;
      const fileContent = fs.readFileSync(path.join(BACKUP_DIR, file), 'utf-8');
      const raw = EJSON.parse(fileContent); // Use EJSON parser instead of JSON.parse
      const docs = Array.isArray(raw) ? raw : raw.documents;
      console.log(`Importing ${file} into collection ${collectionName}...`);
      if (!Array.isArray(docs)) {
        console.error(`${file} does not contain an array, skipping. Content:`, JSON.stringify(raw).slice(0, 200));
        continue;
      }
      const collection = db.collection(collectionName);
      await collection.deleteMany({});
      await collection.insertMany(docs);
      console.log(`Cleared and imported ${docs.length} documents into ${collectionName}.`);
    }
    console.log('All backup files imported.');
  } catch (e) {
    console.error('Import failed:', e);
    process.exit(1);
  } finally {
    await client.close();
  }
}

importBackups();
