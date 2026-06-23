import express from "express";
import { initializeCheckout } from "./stripe/stripe.controller.js";
import { initializeOrder } from "./razorpay/razorpay.controller.js";
import { stripeWebhook } from "./stripe/stripe.webhook.js";
import { razorpayWebhook } from "./razorpay/razorpay.webhook.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/stripe/checkout", requireAuth, initializeCheckout);
router.post("/razorpay/order", requireAuth, initializeOrder);

router.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook,
);
router.post("/razorpay/webhook", express.json(), razorpayWebhook);

export default router;
