import { Router, type Router as RouterType } from "express";

export const healthRouter: RouterType = Router();

healthRouter.get("/", (_req, res) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
    },
  });
});
