const mongoose = require("mongoose");

let _memServer = null;

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI && process.env.MONGODB_URI.trim();

    // If no URI provided, spin up in-memory MongoDB automatically
    if (!uri) {
      console.log("⚡ No MONGODB_URI found — starting In-Memory MongoDB...");
      const { MongoMemoryServer } = require("mongodb-memory-server");
      _memServer = await MongoMemoryServer.create();
      uri = _memServer.getUri();
      console.log(`📦 In-Memory MongoDB ready: ${uri}`);
    }

    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
