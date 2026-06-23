import express from "express";
import { signup, login, refresh, logout } from "./auth.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { signupSchema, loginSchema } from "./auth.validation.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/signup", validate(signupSchema), signup);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", requireAuth, logout);

export default router;
