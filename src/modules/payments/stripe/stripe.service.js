import Stripe from 'stripe';
import { env } from '../../../config/env.js';
import prisma from '../../../config/db.config.js';
import { ApiError } from '../../../utils/apiError.js';

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export const createStripeCheckoutSession = async (userId, amount, idempotencyKey) => {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });

  if (!wallet) {
    throw new ApiError(404, 'Wallet not found');
  }

  const existingPayment = await prisma.payment.findUnique({
    where: { idempotencyKey },
  });

  if (existingPayment) {
    return { duplicate: true, payment: existingPayment };
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Wallet Credit',
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    success_url: `${env.CLIENT_URL}/wallet?payment_status=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.CLIENT_URL}/wallet?payment_status=cancelled`,
    metadata: {
      userId,
      walletId: wallet.id,
      idempotencyKey,
    },
  });

  const payment = await prisma.payment.create({
    data: {
      walletId: wallet.id,
      provider: 'STRIPE',
      status: 'INITIATED',
      amount,
      currency: 'USD',
      providerPaymentId: session.id,
      idempotencyKey,
      metadata: {
        sessionId: session.id,
      },
    },
  });

  return { duplicate: false, payment, sessionUrl: session.url };
};

export const verifyStripeWebhook = (body, signature) => {
  try {
    return stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    throw new ApiError(400, 'Webhook signature verification failed');
  }
};

export const handleStripePaymentSuccess = async (sessionId) => {
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== 'paid') {
    throw new ApiError(400, 'Payment not completed');
  }

  const { userId, walletId, idempotencyKey } = session.metadata;

  const payment = await prisma.payment.findUnique({
    where: { idempotencyKey },
  });

  if (!payment) {
    throw new ApiError(404, 'Payment record not found');
  }

  if (payment.status === 'COMPLETED') {
    return { alreadyProcessed: true, payment };
  }

  const amountInDecimal = Number(payment.amount);

  const result = await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { id: walletId } });

    if (!wallet) {
      throw new ApiError(404, 'Wallet not found');
    }

    const newBalance = Number(wallet.balance) + amountInDecimal;

    const updatedWallet = await tx.wallet.update({
      where: { id: walletId },
      data: { balance: newBalance },
    });

    const transaction = await tx.transaction.create({
      data: {
        walletId,
        type: 'DEPOSIT',
        status: 'COMPLETED',
        amount: amountInDecimal,
        balanceAfter: newBalance,
        reference: sessionId,
        idempotencyKey,
      },
    });

    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: { status: 'COMPLETED' },
    });

    return { wallet: updatedWallet, transaction, payment: updatedPayment };
  });

  return { alreadyProcessed: false, ...result };
};