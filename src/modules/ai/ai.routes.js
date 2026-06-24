import express from 'express';
import { chat, fetchChatHistory, sentiment, insights } from './ai.controller.js';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { chatMessageSchema, sentimentSchema } from './ai.validation.js';

const router = express.Router();

router.use(requireAuth);

router.post('/chat', validate(chatMessageSchema), chat);
router.get('/chat/history', fetchChatHistory);
router.post('/sentiment', validate(sentimentSchema), sentiment);
router.get('/insights', insights);

export default router;