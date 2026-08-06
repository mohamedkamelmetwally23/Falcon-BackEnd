import mongoose from 'mongoose';

export async function connectDatabase() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is missing from backend/.env');
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 8000,
  });
  console.log('MongoDB connected');
  return mongoose.connection;
}
