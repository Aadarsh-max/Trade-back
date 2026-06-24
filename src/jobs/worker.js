import redisClient from '../config/redis.config.js';
import { connectPostgres } from '../config/db.config.js';
import { connectMongo } from '../config/mongo.config.js';
import { createEmailWorker } from './email.job.js';

const startWorkers = async () => {
  await connectPostgres();
  console.log('Worker: Postgres connected');

  await connectMongo();
  console.log('Worker: MongoDB connected');

  await redisClient.ping();
  console.log('Worker: Redis connected');

  createEmailWorker();

  console.log('Workers started: email-queue');
};

startWorkers();