import express from "express";
import {
  getBalance,
  deposit,
  withdraw,
  getHistory,
} from "./wallet.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { depositSchema, withdrawSchema } from "./wallet.validation.js";

const router = express.Router();

router.use(requireAuth);

router.get("/balance", getBalance);
router.post("/deposit", validate(depositSchema), deposit);
router.post("/withdraw", validate(withdrawSchema), withdraw);
router.get("/transactions", getHistory);

export default router;
