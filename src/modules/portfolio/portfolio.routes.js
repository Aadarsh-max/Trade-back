import express from "express";
import { getHoldings, getSummary, getPnl } from "./portfolio.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(requireAuth);

router.get("/holdings", getHoldings);
router.get("/summary", getSummary);
router.get("/pnl", getPnl);

export default router;
