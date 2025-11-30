const mongoose = require('mongoose');

module.exports = async function connectDB(uri) {
  const mongoUri = uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/healthchain';
  try {
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB at', mongoUri);
    return;
  } catch (err) {
    console.warn('Failed to connect to MongoDB at', mongoUri, '— falling back to in-memory MongoDB.', err.message);
  }

  // Fallback to in-memory MongoDB for development/demo
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const memUri = mongod.getUri();
    await mongoose.connect(memUri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to in-memory MongoDB');
    // Keep reference so it isn't GC'd
    module.exports._mongod = mongod;
  } catch (memErr) {
    console.error('Failed to start in-memory MongoDB', memErr);
    process.exit(1);
  }
};
