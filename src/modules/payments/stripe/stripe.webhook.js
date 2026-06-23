import {
  handleStripePaymentSuccess,
  verifyStripeWebhook,
} from "./stripe.service.js";
import { ApiError } from "../../../utils/apiError.js";

export const stripeWebhook = async (req, res, next) => {
  try {
    const event = verifyStripeWebhook(
      req.body,
      req.headers["stripe-signature"],
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      await handleStripePaymentSuccess(session.id);
      return res.json({ received: true });
    }

    return res.json({ received: true });
  } catch (err) {
    next(err);
  }
};
