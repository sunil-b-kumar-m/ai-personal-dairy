import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../services/auth.js";

export interface AuthenticatedRequest extends Request {
  userId: string;
  userEmail: string;
}

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const token = req.cookies?.access_token;

  if (!token) {
    res.status(401).json({ success: false, error: "Authentication required" });
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    (req as AuthenticatedRequest).userId = payload.userId;
    (req as AuthenticatedRequest).userEmail = payload.email;
    next();
  } catch {
    res.status(401).json({ success: false, error: "Token expired" });
  }
}
