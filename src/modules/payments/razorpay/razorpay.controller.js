import { createRazorpayOrder } from './razorpay.service.js';
import { ApiResponse } from '../../../utils/apiResponse.js';
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