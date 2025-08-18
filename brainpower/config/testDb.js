const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

class TestDatabase {
  constructor() {
    this.mongoServer = null;
  }

  async connect() {
    // Create an in-memory MongoDB instance
    this.mongoServer = await MongoMemoryServer.create();
    const mongoUri = this.mongoServer.getUri();
    
    // Connect to the in-memory database
    await mongoose.connect(mongoUri);
    
    return mongoUri;
  }

  async clearDatabase() {
    // Clear all collections
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }

  async closeDatabase() {
    // Close the database connection
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    
    // Stop the in-memory MongoDB instance
    if (this.mongoServer) {
      await this.mongoServer.stop();
    }
  }

  async resetDatabase() {
    await this.clearDatabase();
  }
}

module.exports = TestDatabase;