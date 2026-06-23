import {
  handleRazorpayPaymentSuccess,
  verifyRazorpaySignature,
} from "./razorpay.service.js";
import { env } from "../../../config/env.js";
import { ApiError } from "../../../utils/apiError.js";

export const razorpayWebhook = async (req, res, next) => {
  try {
    const { payment_id, order_id } = req.body.payload.payment.entity;
    const { idempotencyKey } = req.body.payload.order.entity.notes;
    const signature = req.headers["x-razorpay-signature"];

    verifyRazorpaySignature(
      order_id,
      payment_id,
      signature,
      env.RAZORPAY_WEBHOOK_SECRET,
    );

    await handleRazorpayPaymentSuccess(payment_id, order_id, idempotencyKey);

    return res.json({ status: "ok" });
  } catch (err) {
    next(err);
  }
};
