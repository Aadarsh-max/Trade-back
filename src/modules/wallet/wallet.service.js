import prisma from '../../config/db.config.js';
import { ApiError } from '../../utils/apiError.js';
import { createNotification } from '../notifications/notification.service.js';

export const getOrCreateWallet = async (userId) => {
  let wallet = await prisma.wallet.findUnique({ where: { userId } });

  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: { userId },
    });
  }

  return wallet;
};

export const getWalletBalance = async (userId) => {
  const wallet = await getOrCreateWallet(userId);
  return wallet;
};

export const depositToWallet = async (userId, amount, idempotencyKey) => {
  const existing = await prisma.transaction.findUnique({
    where: { idempotencyKey },
  });

  if (existing) {
    return { duplicate: true, transaction: existing };
  }

  const result = await prisma.$transaction(async (tx) => {
    let wallet = await tx.wallet.findUnique({ where: { userId } });

    if (!wallet) {
      wallet = await tx.wallet.create({ data: { userId } });
    }

    const newBalance = Number(wallet.balance) + amount;

    const updatedWallet = await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: newBalance },
    });

    const transaction = await tx.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'DEPOSIT',
        status: 'COMPLETED',
        amount,
        balanceAfter: newBalance,
        idempotencyKey,
      },
    });

    return { wallet: updatedWallet, transaction };
  });

  await createNotification({
    userId,
    type: 'DEPOSIT',
    title: 'Deposit successful',
    message: `₹${amount.toLocaleString()} was added to your wallet`,
  });

  return { duplicate: false, ...result };
};

export const withdrawFromWallet = async (userId, amount, idempotencyKey) => {
  const existing = await prisma.transaction.findUnique({
    where: { idempotencyKey },
  });

  if (existing) {
    return { duplicate: true, transaction: existing };
  }

  const result = await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId } });

    if (!wallet) {
      throw new ApiError(404, 'Wallet not found');
    }

    const currentBalance = Number(wallet.balance);

    if (currentBalance < amount) {
      throw new ApiError(400, 'Insufficient balance');
    }

    const newBalance = currentBalance - amount;

    const updatedWallet = await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: newBalance },
    });

    const transaction = await tx.transaction.create({
      data: {
        walletId: wallet.id,
        type: 'WITHDRAWAL',
        status: 'COMPLETED',
        amount,
        balanceAfter: newBalance,
        idempotencyKey,
      },
    });

    return { wallet: updatedWallet, transaction };
  });

  await createNotification({
    userId,
    type: 'WITHDRAWAL',
    title: 'Withdrawal successful',
    message: `₹${amount.toLocaleString()} was withdrawn from your wallet`,
  });

  return { duplicate: false, ...result };
};

export const getTransactionHistory = async (userId, { page = 1, limit = 20 }) => {
  const wallet = await getOrCreateWallet(userId);

  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.transaction.count({ where: { walletId: wallet.id } }),
  ]);

  return { transactions, total, page, limit };
};