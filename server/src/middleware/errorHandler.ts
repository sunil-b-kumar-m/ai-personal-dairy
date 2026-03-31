import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error(err.stack);

  res.status(500).json({
    success: false,
    error:
      env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
}
