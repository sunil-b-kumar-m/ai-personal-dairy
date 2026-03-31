import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import passport from "../config/passport.js";
import { prisma } from "../models/prisma.js";
import {
  hashPassword,
  generateAccessToken,
  generateRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  setAuthCookies,
  clearAuthCookies,
  getUserWithRolesAndPermissions,
  assignDefaultRole,
} from "../services/auth.js";
import { env } from "../config/env.js";
import type { AuthenticatedRequest } from "../middleware/authenticate.js";

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      res.status(409).json({ success: false, error: "Email already registered" });
      return;
    }

    const passwordHash = await hashPassword(data.password);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash,
        provider: "local",
      },
    });

    await assignDefaultRole(user.id);

    const accessToken = generateAccessToken(user.id, user.email);
    const refreshToken = await generateRefreshToken(user.id);
    setAuthCookies(res, accessToken, refreshToken);

    const authData = await getUserWithRolesAndPermissions(user.id);
    res.status(201).json({ success: true, data: authData });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: error.errors.map((e) => e.message).join(", "),
      });
      return;
    }
    next(error);
  }
}

export function login(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  try {
    loginSchema.parse(req.body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: error.errors.map((e) => e.message).join(", "),
      });
      return;
    }
  }

  passport.authenticate(
    "local",
    { session: false },
    async (
      err: Error | null,
      user: { id: string; email: string } | false,
      info: { message: string } | undefined,
    ) => {
      if (err) return next(err);
      if (!user) {
        res.status(401).json({
          success: false,
          error: info?.message || "Invalid email or password",
        });
        return;
      }

      try {
        const accessToken = generateAccessToken(user.id, user.email);
        const refreshToken = await generateRefreshToken(user.id);
        setAuthCookies(res, accessToken, refreshToken);

        const authData = await getUserWithRolesAndPermissions(user.id);
        res.json({ success: true, data: authData });
      } catch (error) {
        next(error);
      }
    },
  )(req, res, next);
}

export async function logout(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const refreshToken = req.cookies?.refresh_token;
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }
    clearAuthCookies(res);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      res.status(401).json({ success: false, error: "No refresh token" });
      return;
    }

    const tokens = await rotateRefreshToken(refreshToken);
    if (!tokens) {
      clearAuthCookies(res);
      res.status(401).json({ success: false, error: "Invalid refresh token" });
      return;
    }

    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function me(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).userId;
    const authData = await getUserWithRolesAndPermissions(userId);

    if (!authData) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }

    res.json({ success: true, data: authData });
  } catch (error) {
    next(error);
  }
}

// Google OAuth handlers
export function googleAuth(req: Request, res: Response, next: NextFunction): void {
  passport.authenticate("google", { scope: ["profile", "email"], session: false })(req, res, next);
}

export function googleCallback(req: Request, res: Response, next: NextFunction): void {
  passport.authenticate(
    "google",
    { session: false },
    async (
      err: Error | null,
      user: { id: string; email: string } | false,
      info: { message: string } | undefined,
    ) => {
      if (err) return next(err);
      if (!user) {
        const errorMsg = encodeURIComponent(info?.message || "OAuth failed");
        res.redirect(`${env.CLIENT_URL}/login?error=${errorMsg}`);
        return;
      }

      try {
        const accessToken = generateAccessToken(user.id, user.email);
        const refreshToken = await generateRefreshToken(user.id);
        setAuthCookies(res, accessToken, refreshToken);
        res.redirect(`${env.CLIENT_URL}/auth/callback`);
      } catch (error) {
        next(error);
      }
    },
  )(req, res, next);
}

// Microsoft OAuth handlers
export function microsoftAuth(req: Request, res: Response, next: NextFunction): void {
  passport.authenticate("microsoft", { scope: ["user.read"], session: false })(req, res, next);
}

export function microsoftCallback(req: Request, res: Response, next: NextFunction): void {
  passport.authenticate(
    "microsoft",
    { session: false },
    async (
      err: Error | null,
      user: { id: string; email: string } | false,
      info: { message: string } | undefined,
    ) => {
      if (err) return next(err);
      if (!user) {
        const errorMsg = encodeURIComponent(info?.message || "OAuth failed");
        res.redirect(`${env.CLIENT_URL}/login?error=${errorMsg}`);
        return;
      }

      try {
        const accessToken = generateAccessToken(user.id, user.email);
        const refreshToken = await generateRefreshToken(user.id);
        setAuthCookies(res, accessToken, refreshToken);
        res.redirect(`${env.CLIENT_URL}/auth/callback`);
      } catch (error) {
        next(error);
      }
    },
  )(req, res, next);
}
