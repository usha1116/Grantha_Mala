import mongoose from 'mongoose';
import { log } from './vite';

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is not set");
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    log('Connected to MongoDB');
  })
  .catch((error) => {
    log('MongoDB connection error:', error);
    process.exit(1);
  });

export const db = mongoose.connection;