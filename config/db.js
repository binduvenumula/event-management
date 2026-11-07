const mongoose = require('mongoose');

// Connects to MongoDB (local or Atlas, depending on MONGO_URI).
module.exports = async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    console.error('Is MongoDB running? Check MONGO_URI in server/.env');
    process.exit(1);
  }
};
