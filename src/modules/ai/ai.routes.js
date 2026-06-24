import express from "express";
import {
  chat,
  fetchChatHistory,
  sentiment,
  insights,
} from "./ai.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { chatMessageSchema, sentimentSchema } from "./ai.validation.js";
import {
  getCachedDailySummary,
  triggerDailySummaryNow,
} from "../../jobs/ai-summary.job.js";

const router = express.Router();

router.use(requireAuth);

router.post("/chat", validate(chatMessageSchema), chat);
router.get("/chat/history", fetchChatHistory);
router.post("/sentiment", validate(sentimentSchema), sentiment);
router.get("/insights", insights);

router.get("/daily-summary", async (req, res, next) => {
  try {
    const summary = await getCachedDailySummary();
    return new ApiResponse(200, "Daily summary fetched", summary).send(res);
  } catch (err) {
    next(err);
  }
});

router.post("/daily-summary/trigger", async (req, res, next) => {
  try {
    const summary = await triggerDailySummaryNow();
    return new ApiResponse(200, "Daily summary generated", summary).send(res);
  } catch (err) {
    next(err);
  }
});

export default router;
