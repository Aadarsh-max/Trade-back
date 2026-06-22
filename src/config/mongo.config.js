import mongoose from 'mongoose';
import { env } from './env.js';

export const connectMongo = async () => {
  await mongoose.connect(env.MONGO_URI);
  return mongoose.connection;
};

export default mongoose;