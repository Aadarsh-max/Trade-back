import prisma from '../../config/db.config.js';
import { ApiError } from '../../utils/apiError.js';
import {
  notifyOrderFilled,
  notifyOrderRejected,
} from '../../sockets/order.socket.js';
import { createNotification } from '../notifications/notification.service.js';
import { usdToInr } from '../../utils/currency.js';

export const executeTrade = async (orderId, executionPriceUsd) => {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });

    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    if (order.status !== 'PENDING') {
      throw new ApiError(400, 'Order is not pending');
    }

    const quantity = Number(order.quantity);
    const executionPriceInr = await usdToInr(executionPriceUsd);
    const totalInr = quantity * executionPriceInr;

    const wallet = await tx.wallet.findUnique({
      where: { userId: order.userId },
    });

    if (!wallet) {
      throw new ApiError(404, 'Wallet not found');
    }

    const currentBalance = Number(wallet.balance);

    if (order.side === 'BUY') {
      if (currentBalance < totalInr) {
        await tx.order.update({
          where: { id: order.id },
          data: { status: 'REJECTED' },
        });
        notifyOrderRejected(order.userId, {
          orderId: order.id,
          reason: 'Insufficient balance',
        });
        await createNotification({
          userId: order.userId,
          type: 'ORDER_REJECTED',
          title: 'Order rejected',
          message: `Insufficient balance to place this ${order.side} order for ${order.symbol}`,
        });
        throw new ApiError(400, 'Insufficient balance for this order');
      }

      const newBalance = currentBalance - totalInr;

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'TRADE_DEBIT',
          status: 'COMPLETED',
          amount: totalInr,
          balanceAfter: newBalance,
          reference: order.id,
        },
      });

      const existingHolding = await tx.holding.findUnique({
        where: {
          userId_symbol: { userId: order.userId, symbol: order.symbol },
        },
      });

      if (existingHolding) {
        const oldQty = Number(existingHolding.quantity);
        const oldAvgPrice = Number(existingHolding.avgBuyPrice);
        const newQty = oldQty + quantity;
        const newAvgPrice =
          (oldQty * oldAvgPrice + quantity * executionPriceInr) / newQty;

        await tx.holding.update({
          where: { id: existingHolding.id },
          data: { quantity: newQty, avgBuyPrice: newAvgPrice },
        });
      } else {
        await tx.holding.create({
          data: {
            userId: order.userId,
            symbol: order.symbol,
            quantity,
            avgBuyPrice: executionPriceInr,
          },
        });
      }
    } else {
      const existingHolding = await tx.holding.findUnique({
        where: {
          userId_symbol: { userId: order.userId, symbol: order.symbol },
        },
      });

      if (!existingHolding || Number(existingHolding.quantity) < quantity) {
        await tx.order.update({
          where: { id: order.id },
          data: { status: 'REJECTED' },
        });
        notifyOrderRejected(order.userId, {
          orderId: order.id,
          reason: 'Insufficient holdings',
        });
        await createNotification({
          userId: order.userId,
          type: 'ORDER_REJECTED',
          title: 'Order rejected',
          message: `Insufficient holdings to place this sell order for ${order.symbol}`,
        });
        throw new ApiError(400, 'Insufficient holdings for this sell order');
      }

      const newQty = Number(existingHolding.quantity) - quantity;

      if (newQty === 0) {
        await tx.holding.delete({ where: { id: existingHolding.id } });
      } else {
        await tx.holding.update({
          where: { id: existingHolding.id },
          data: { quantity: newQty },
        });
      }

      const newBalance = currentBalance + totalInr;

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'TRADE_CREDIT',
          status: 'COMPLETED',
          amount: totalInr,
          balanceAfter: newBalance,
          reference: order.id,
        },
      });
    }

    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: {
        status: 'FILLED',
        filledPrice: executionPriceInr,
        filledAt: new Date(),
      },
    });

    const trade = await tx.trade.create({
      data: {
        orderId: order.id,
        symbol: order.symbol,
        side: order.side,
        quantity,
        price: executionPriceInr,
        total: totalInr,
      },
    });

    notifyOrderFilled(order.userId, { order: updatedOrder, trade });

    await createNotification({
      userId: order.userId,
      type: 'ORDER_FILLED',
      title: 'Order filled',
      message: `${order.side} ${quantity} ${order.symbol} at ₹${executionPriceInr.toLocaleString()} ($${executionPriceUsd.toLocaleString()} USD)`,
    });

    return { order: updatedOrder, trade };
  });
};

export const checkLimitOrderMatch = (order, currentPrice) => {
  const limitPrice = Number(order.limitPrice);

  if (order.side === 'BUY') {
    return currentPrice <= limitPrice;
  }

  return currentPrice >= limitPrice;
};