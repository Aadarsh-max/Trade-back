import { createStripeCheckoutSession } from './stripe.service.js';
import { ApiResponse } from '../../../utils/apiResponse.js';
import { v4 as uuidv4 } from 'uuid';

export const initializeCheckout = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const idempotencyKey = uuidv4();

    const result = await createStripeCheckoutSession(req.user.userId, amount, idempotencyKey);

    if (result.duplicate) {
      return new ApiResponse(200, 'Checkout session already exists', {
        sessionUrl: null,
        paymentId: result.payment.id,
      }).send(res);
    }

    return new ApiResponse(201, 'Stripe checkout session created', {
      sessionUrl: result.sessionUrl,
      paymentId: result.payment.id,
    }).send(res);
  } catch (err) {
    next(err);
  }
};