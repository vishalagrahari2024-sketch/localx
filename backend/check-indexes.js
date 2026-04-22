require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('Connected to DB');
    const db = mongoose.connection.db;
    const collections = await db.collections();
    for (const collection of collections) {
      if (collection.collectionName === 'users') {
        const indexes = await collection.indexes();
        console.log('Indexes for users:', JSON.stringify(indexes, null, 2));
      }
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
