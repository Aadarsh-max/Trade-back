import prisma from '../../config/db.config.js';
import { ApiError } from '../../utils/apiError.js';
import { getQuote } from '../market-data/market.service.js';
import { executeTrade } from './matching-engine.js';

export const placeOrder = async (userId, { symbol, side, type, quantity, limitPrice }) => {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });

  if (!wallet) {
    throw new ApiError(404, 'Wallet not found');
  }

  if (side === 'BUY') {
    const quote = await getQuote(symbol);
    const estimatedCost = quantity * (type === 'LIMIT' ? limitPrice : quote.price);

    if (Number(wallet.balance) < estimatedCost) {
      throw new ApiError(400, 'Insufficient balance to place this order');
    }
  } else {
    const holding = await prisma.holding.findUnique({
      where: { userId_symbol: { userId, symbol } },
    });

    if (!holding || Number(holding.quantity) < quantity) {
      throw new ApiError(400, 'Insufficient holdings to place this sell order');
    }
  }

  const order = await prisma.order.create({
    data: {
      userId,
      symbol: symbol.toUpperCase(),
      side,
      type,
      quantity,
      limitPrice: type === 'LIMIT' ? limitPrice : null,
    },
  });

  if (type === 'MARKET') {
    const quote = await getQuote(symbol);
    const result = await executeTrade(order.id, quote.price);
    return result;
  }

  return { order, trade: null };
};

export const cancelOrder = async (userId, orderId) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (order.userId !== userId) {
    throw new ApiError(403, 'You do not own this order');
  }

  if (order.status !== 'PENDING') {
    throw new ApiError(400, 'Only pending orders can be cancelled');
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status: 'CANCELLED' },
  });

  return updatedOrder;
};

export const getUserOrders = async (userId, { status, page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;

  const where = { userId };
  if (status) {
    where.status = status;
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, total, page, limit };
};

export const getOrderById = async (userId, orderId) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { trades: true },
  });

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (order.userId !== userId) {
    throw new ApiError(403, 'You do not own this order');
  }

  return order;
};