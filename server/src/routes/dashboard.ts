import { Router, type Router as RouterType } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { getOverview } from "../controllers/dashboard.js";

export const dashboardRouter: RouterType = Router();
dashboardRouter.use(authenticate);
dashboardRouter.get("/overview", getOverview);
