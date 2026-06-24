import cron from 'node-cron';
import prisma from '../config/db.config.js';
import { getQuote } from '../modules/market-data/market.service.js';
import { checkLimitOrderMatch, executeTrade } from '../modules/orders/matching-engine.js';

const checkPendingLimitOrders = async () => {
  const pendingOrders = await prisma.order.findMany({
    where: { status: 'PENDING', type: 'LIMIT' },
  });

  for (const order of pendingOrders) {
    try {
      const quote = await getQuote(order.symbol);

      if (checkLimitOrderMatch(order, quote.price)) {
        await executeTrade(order.id, quote.price);
        console.log(`Limit order ${order.id} executed at ${quote.price}`);
      }
    } catch (err) {
      console.error(`Failed to process limit order ${order.id}`, err.message);
    }
  }
};

export const startOrderExecutionPolling = () => {
  cron.schedule('*/10 * * * * *', checkPendingLimitOrders);
  console.log('Order execution polling job started');
};