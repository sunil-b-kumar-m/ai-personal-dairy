import { Router, type Router as RouterType } from "express";
import { authenticate } from "../middleware/authenticate.js";
import {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  generateReminders,
} from "../controllers/reminders.js";

export const remindersRouter: RouterType = Router();

remindersRouter.use(authenticate);
remindersRouter.get("/", getReminders);
remindersRouter.post("/", createReminder);
remindersRouter.post("/generate", generateReminders);
remindersRouter.put("/:id", updateReminder);
remindersRouter.delete("/:id", deleteReminder);
