import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { AppError } from "../utils/errors.js";
import { env } from "../config/env.js";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  // AppError subclasses (NotFoundError, ConflictError, etc.)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // Zod validation errors
  if (err instanceof z.ZodError) {
    res.status(400).json({
      success: false,
      error: err.errors.map((e) => e.message).join(", "),
    });
    return;
  }

  // Unknown / programming errors
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error:
      env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
}
