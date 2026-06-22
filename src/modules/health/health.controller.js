import prisma from '../../config/db.config.js';
import mongoose from '../../config/mongo.config.js';
import redisClient from '../../config/redis.config.js';
import { ApiResponse } from '../../utils/apiResponse.js';

export const healthCheck = async (req, res, next) => {
  const status = {
    postgres: 'down',
    mongo: 'down',
    redis: 'down',
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    status.postgres = 'up';
  } catch (err) {
    status.postgres = 'down';
  }

  status.mongo = mongoose.connection.readyState === 1 ? 'up' : 'down';

  try {
    const pong = await redisClient.ping();
    status.redis = pong === 'PONG' ? 'up' : 'down';
  } catch (err) {
    status.redis = 'down';
  }

  const allUp = Object.values(status).every((s) => s === 'up');
  const statusCode = allUp ? 200 : 503;

  return new ApiResponse(statusCode, allUp ? 'All systems operational' : 'Some systems are down', status).send(res);
};