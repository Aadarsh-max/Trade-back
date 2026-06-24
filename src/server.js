import http from 'http';
import app from './app.js';
import { env } from './config/env.js';
import { connectPostgres } from './config/db.config.js';
import { connectMongo } from './config/mongo.config.js';
import redisClient from './config/redis.config.js';
import { startPricePolling } from './jobs/price-poll.job.js';
import { startOrderExecutionPolling } from './jobs/order-execution.job.js';
import { initSocketServer } from './sockets/socket.server.js';

const startServer = async () => {
  try {
    await connectPostgres();
    console.log('Postgres connected');

    await connectMongo();
    console.log('MongoDB connected');

    await redisClient.ping();
    console.log('Redis connected');

    const httpServer = http.createServer(app);

    initSocketServer(httpServer);
    console.log('Socket.io initialized');

    startPricePolling();
    startOrderExecutionPolling();

    httpServer.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
};

startServer();