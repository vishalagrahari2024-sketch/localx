const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Post = require('./models/Post');

dotenv.config();

const fixIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    console.log('Dropping all indexes from Post collection...');
    await Post.collection.dropIndexes();
    console.log('Indexes dropped.');

    console.log('Re-syncing indexes...');
    // Mongoose will automatically recreate indexes based on the schema
    await Post.syncIndexes();
    console.log('Indexes synced successfully.');

    process.exit(0);
  } catch (error) {
    console.error('Error fixing indexes:', error);
    process.exit(1);
  }
};

fixIndexes();
