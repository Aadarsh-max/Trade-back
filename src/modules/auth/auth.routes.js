import express from "express";
import { signup, login, refresh, logout } from "./auth.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { signupSchema, loginSchema } from "./auth.validation.js";
import { requireAuth } from "../../middlewares/auth.middleware.js"
import { authLimiter } from "../../middlewares/rateLimiter.middleware.js";

const router = express.Router();

router.post("/signup", authLimiter, validate(signupSchema), signup);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", requireAuth, logout);

export default router;
