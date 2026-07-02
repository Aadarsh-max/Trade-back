import { createRazorpayOrder, verifyAndCreditRazorpayPayment } from './razorpay.service.js';
import { ApiResponse } from '../../../utils/apiResponse.js';
import { ApiError } from '../../../utils/apiError.js';
import { v4 as uuidv4 } from 'uuid';

export const initializeOrder = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const idempotencyKey = uuidv4();

    const result = await createRazorpayOrder(req.user.userId, amount, idempotencyKey);

    if (result.duplicate) {
      return new ApiResponse(200, 'Order already exists', {
        orderId: result.payment.providerOrderId,
        paymentId: result.payment.id,
      }).send(res);
    }

    return new ApiResponse(201, 'Razorpay order created', {
      orderId: result.orderId,
      paymentId: result.payment.id,
      amount,
      currency: 'INR',
    }).send(res);
  } catch (err) {
    next(err);
  }
};

export const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return next(new ApiError(400, 'Missing payment verification fields'));
    }

    const result = await verifyAndCreditRazorpayPayment(
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      req.user.userId
    );

    if (result.alreadyProcessed) {
      return new ApiResponse(200, 'Payment already processed').send(res);
    }

    return new ApiResponse(200, 'Payment verified and wallet credited', result).send(res);
  } catch (err) {
    next(err);
  }
};