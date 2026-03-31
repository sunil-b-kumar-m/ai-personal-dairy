import { Router, type Router as RouterType } from "express";
import { authenticate } from "../middleware/authenticate.js";
import {
  register,
  login,
  logout,
  refresh,
  me,
  googleAuth,
  googleCallback,
  microsoftAuth,
  microsoftCallback,
  verifyEmailHandler,
  resendVerificationHandler,
} from "../controllers/auth.js";
import { env } from "../config/env.js";

export const authRouter: RouterType = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", authenticate, logout);
authRouter.post("/refresh", refresh);
authRouter.get("/me", authenticate, me);
authRouter.get("/verify-email", verifyEmailHandler);
authRouter.post("/resend-verification", authenticate, resendVerificationHandler);

// Google OAuth (only if configured)
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  authRouter.get("/google", googleAuth);
  authRouter.get("/google/callback", googleCallback);
}

// Microsoft OAuth (only if configured)
if (env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET) {
  authRouter.get("/microsoft", microsoftAuth);
  authRouter.get("/microsoft/callback", microsoftCallback);
}
