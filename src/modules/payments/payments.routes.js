import express from 'express';
import { initializeCheckout, verifyPayment } from './stripe/stripe.controller.js';
import { initializeOrder, verifyRazorpayPayment } from './razorpay/razorpay.controller.js';
import { stripeWebhook } from './stripe/stripe.webhook.js';
import { razorpayWebhook } from './razorpay/razorpay.webhook.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/stripe/checkout', requireAuth, initializeCheckout);
router.post('/stripe/verify', requireAuth, verifyPayment);
router.post('/razorpay/order', requireAuth, initializeOrder);
router.post('/razorpay/verify', requireAuth, verifyRazorpayPayment);

router.post('/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook);
router.post('/razorpay/webhook', express.json(), razorpayWebhook);

export default router;