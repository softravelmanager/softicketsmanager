const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

/**
 * Anonymizes the Users collection.
 * Replaces names, emails, and resets all passwords to a standard demo password.
 */
async function anonymizeUsers(db, faker) {
  console.log('Anonymizing Users...');
  const code = '111111';
  const usersCollection = db.collection('users');
  const users = await usersCollection.find({}).toArray();
  const salt = bcrypt.genSaltSync(10);
  const demoPasswordHash = bcrypt.hashSync(code, salt);

  if (users.length === 0) {
    console.log('No users to anonymize.');
    return;
  }

  const operations = users.map((user, index) => {
    const isAgency = user.lastName?.toLowerCase().includes('agency');
    let firstName, lastName;

    if (isAgency) {
      firstName = 'Demo';
      lastName = `Agency ${index + 1}`;
    } else {
      firstName = faker.person.firstName();
      lastName = faker.person.lastName();
    }

    return {
      updateOne: {
        filter: { _id: user._id },
        update: {
          $set: {
            firstName,
            lastName,
            email: `user${index + 1}@example.com`,
            hash: demoPasswordHash,
            balance: faker.finance.amount({ min: -500, max: 2000, dec: 2 }),
          },
        },
      },
    };
  });

  await usersCollection.bulkWrite(operations);
  console.log(`Anonymized ${operations.length} users. Default password`);
}

/**
 * Anonymizes the Tickets collection.
 * Replaces passenger info and obfuscates financial data.
 */
async function anonymizeTickets(db, faker) {
  console.log('Anonymizing Tickets...');
  const ticketsCollection = db.collection('tickets');
  const tickets = await ticketsCollection.find({}).toArray();

  if (tickets.length === 0) {
    console.log('No tickets to anonymize.');
    return;
  }
  // Helper to obfuscate financial data by a random amount (+/- 20%) to maintain realism
  const obfuscateAmount = (amount) => {
    if (amount == null || isNaN(parseFloat(amount))) return '0.00';
    const value = parseFloat(amount);
    const randomFactor = 1 + (Math.random() - 0.5) * 0.4; // +/- 20%
    return (value * randomFactor).toFixed(2);
  };
  // Helper to generate a recent, fake date string in YYYY-MM-DD format
  const fakeDate = () => {
    const date = faker.date.recent({ days: 365 });
    // The toISOString() format is "YYYY-MM-DDTHH:mm:ss.sssZ", we just need the date part.
    return date.toISOString().split('T')[0];
  };

  const operations = tickets.map(ticket => {
    return {
      updateOne: {
        filter: { _id: ticket._id },
        update: {
          $set: {
            name: faker.person.fullName().toUpperCase(),
            bookingCode: faker.string.alphanumeric(6).toUpperCase(),
            ticketNumber: faker.string.numeric(13),
            phone: faker.phone.number(),
            cardNumber: `**** **** **** ${faker.string.numeric(4)}`,
            paymentMethod: faker.finance.transactionType(),
            paidAmount: obfuscateAmount(ticket.paidAmount),
            receivingAmount1: obfuscateAmount(ticket.receivingAmount1),
            receivingAmount1Date: ticket.receivingAmount1Date ? fakeDate() : '',
            receivingAmount2: obfuscateAmount(ticket.receivingAmount2),
            receivingAmount2Date: ticket.receivingAmount2Date ? fakeDate() : '',
            receivingAmount2Method: ticket.receivingAmount2Method ? faker.finance.transactionType() : '',
            receivingAmount3: obfuscateAmount(ticket.receivingAmount3),
            receivingAmount3Date: ticket.receivingAmount3Date ? fakeDate() : '',
            receivingAmount3Method: ticket.receivingAmount3Method ? faker.finance.transactionType() : '',
            agentCost: obfuscateAmount(ticket.agentCost),
            paidByAgent: obfuscateAmount(ticket.paidByAgent),
            refund: obfuscateAmount(ticket.refund),
            refundUsed: obfuscateAmount(ticket.refundUsed),
            supplied: obfuscateAmount(ticket.supplied),
            returned: obfuscateAmount(ticket.returned),
            desc: 'This is a sample note for a demo ticket.',
          },
        },
      },
    };
  });

  await ticketsCollection.bulkWrite(operations);
  console.log(`Anonymized ${operations.length} tickets.`);
}

/**
 * Anonymizes financial operations collections.
 * Tweaks amounts slightly for consistency.
 */
async function anonymizeOperations(db, collectionName) {
  console.log(`Anonymizing ${collectionName}...`);
  const collection = db.collection(collectionName);
  const documents = await collection.find({}).toArray();

  if (documents.length === 0) {
    console.log(`No documents in ${collectionName} to anonymize.`);
    return;
  }

  const operations = documents.map(doc => {
    const updates = {};
    for (const key in doc) {
      // If a key looks like a financial amount, obfuscate it. NOTE: There was a bug here using 'op' instead of 'doc'.
      if (key.toLowerCase().includes('amount') || key.toLowerCase().includes('supplied') || key.toLowerCase().includes('balance') || key.toLowerCase().includes('total')) {
        const value = doc[key];
        if (value != null && !isNaN(parseFloat(value))) {
          const randomFactor = 1 + (Math.random() - 0.5) * 0.1; // Tweak by +/- 5%
          updates[key] = (parseFloat(value) * randomFactor).toFixed(2);
        }
      }
    }
    if (Object.keys(updates).length > 0) {
      return {
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: updates },
        },
      };
    }
    return null;
  }).filter(Boolean); // Remove nulls if no updates were needed

  if (operations.length > 0) {
    await collection.bulkWrite(operations);
  }
  console.log(`Anonymized ${operations.length} documents in ${collectionName}.`);
}

/**
 * Anonymizes the Expenses collection.
 */
async function anonymizeExpenses(db, faker) {
  console.log('Anonymizing Expenses...');
  const expensesCollection = db.collection('expenses');
  const expenses = await expensesCollection.find({}).toArray();

  if (expenses.length === 0) {
    console.log('No expenses to anonymize.');
    return;
  }

  const operations = expenses.map(expense => {
    return {
      updateOne: {
        filter: { _id: expense._id },
        update: {
          $set: {
            title: faker.finance.transactionDescription(),
            desc: 'Sample expense description.',
            amount: faker.finance.amount({ min: 5, max: 500, dec: 2 }),
          },
        },
      },
    };
  });

  await expensesCollection.bulkWrite(operations);
  console.log(`Anonymized ${operations.length} expenses.`);
}

/**
 * Main function to run the entire anonymization process.
 */
async function run() {
  const [,, mongoUri] = process.argv;
  if (!mongoUri) {
    console.error('Usage: node anonymize-db.js <mongodb-uri>');
    process.exit(1);
  }

  // Dynamically import faker
  const { faker } = await import('@faker-js/faker');

  const client = new MongoClient(mongoUri);

  try {
    console.log(`Starting database anonymization...`);
    console.log(`Connecting to database...`);
    await client.connect();
    const db = client.db(); // Get DB instance from the connection URI
    console.log('Database connected successfully.');

    // Run all anonymization functions
    await anonymizeUsers(db, faker);
    await anonymizeTickets(db, faker);
    await anonymizeOperations(db, 'operations');
    await anonymizeOperations(db, 'agentsoperations');
    await anonymizeExpenses(db, faker);

    console.log('\nDatabase anonymization complete!');
  } catch (error) {
    console.error('An error occurred during anonymization:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('Database connection closed.');
  }
}

run();
