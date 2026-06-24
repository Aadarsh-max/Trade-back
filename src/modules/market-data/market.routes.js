import express from 'express';
import { getSymbolQuote, getSymbolCandles, getBatchQuotes } from './market.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { multiQuoteSchema } from './market.validation.js';

const router = express.Router();

router.use(requireAuth);

router.get('/quote/:symbol', getSymbolQuote);
router.get('/candles/:symbol', getSymbolCandles);
router.post('/quotes/batch', validate(multiQuoteSchema), getBatchQuotes);

export default router;