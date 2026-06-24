import express from 'express';
import { createOrder, cancelUserOrder, listOrders, getOrder } from './order.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { placeOrderSchema } from './order.validation.js';
import { orderLimiter } from '../../middlewares/rateLimiter.middleware.js';

const router = express.Router();

router.use(requireAuth);

router.post('/', orderLimiter, validate(placeOrderSchema), createOrder);
router.get('/', listOrders);
router.get('/:orderId', getOrder);
router.patch('/:orderId/cancel', cancelUserOrder);

export default router;