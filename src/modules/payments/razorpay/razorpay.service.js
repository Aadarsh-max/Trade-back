import Razorpay from "razorpay";
import crypto from "crypto";
import { env } from "../../../config/env.js";
import prisma from "../../../config/db.config.js";
import { ApiError } from "../../../utils/apiError.js";

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
});

export const createRazorpayOrder = async (userId, amount, idempotencyKey) => {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });

  if (!wallet) {
    throw new ApiError(404, "Wallet not found");
  }

  const existingPayment = await prisma.payment.findUnique({
    where: { idempotencyKey },
  });

  if (existingPayment) {
    return { duplicate: true, payment: existingPayment };
  }

  const order = await razorpay.orders.create({
    amount: Math.round(amount * 100),
    currency: "INR",
    receipt: idempotencyKey,
    notes: {
      userId,
      walletId: wallet.id,
    },
  });

  const payment = await prisma.payment.create({
    data: {
      walletId: wallet.id,
      provider: "RAZORPAY",
      status: "INITIATED",
      amount,
      currency: "INR",
      providerPaymentId: order.id,
      providerOrderId: order.id,
      idempotencyKey,
      metadata: {
        orderId: order.id,
      },
    },
  });

  return { duplicate: false, payment, orderId: order.id };
};

export const verifyRazorpaySignature = (
  orderId,
  paymentId,
  signature,
  secret,
) => {
  const body = orderId + "|" + paymentId;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  if (expectedSignature !== signature) {
    throw new ApiError(400, "Invalid signature");
  }

  return true;
};

export const handleRazorpayPaymentSuccess = async (
  paymentId,
  orderId,
  idempotencyKey,
) => {
  const payment = await prisma.payment.findUnique({
    where: { idempotencyKey },
  });

  if (!payment) {
    throw new ApiError(404, "Payment record not found");
  }

  if (payment.status === "COMPLETED") {
    return { alreadyProcessed: true, payment };
  }

  const amountInDecimal = Number(payment.amount);
  const walletId = payment.walletId;

  const result = await prisma.$transaction(async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { id: walletId } });

    if (!wallet) {
      throw new ApiError(404, "Wallet not found");
    }

    const newBalance = Number(wallet.balance) + amountInDecimal;

    const updatedWallet = await tx.wallet.update({
      where: { id: walletId },
      data: { balance: newBalance },
    });

    const transaction = await tx.transaction.create({
      data: {
        walletId,
        type: "DEPOSIT",
        status: "COMPLETED",
        amount: amountInDecimal,
        balanceAfter: newBalance,
        reference: paymentId,
        idempotencyKey,
      },
    });

    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "COMPLETED",
        providerPaymentId: paymentId,
      },
    });

    return { wallet: updatedWallet, transaction, payment: updatedPayment };
  });

  return { alreadyProcessed: false, ...result };
};
