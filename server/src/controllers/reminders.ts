import { z } from "zod";
import * as remindersService from "../services/reminders.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { NotFoundError } from "../utils/errors.js";
import type { AuthenticatedRequest } from "../middleware/authenticate.js";
import { getParam } from "../utils/params.js";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  dueDate: z.string().optional(),
  recurringDay: z.number().min(1).max(31).optional(),
  frequency: z.enum(["once", "monthly", "quarterly", "yearly"]),
});

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  dueDate: z.string().optional(),
  recurringDay: z.number().min(1).max(31).optional(),
  frequency: z.enum(["once", "monthly", "quarterly", "yearly"]).optional(),
  isActive: z.boolean().optional(),
});

export const getReminders = asyncHandler(async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;
  const type = req.query.type as string | undefined;
  const upcoming = req.query.upcoming === "true";

  if (upcoming) {
    const reminders = await remindersService.getUpcomingReminders(userId);
    res.json({ success: true, data: reminders });
  } else {
    const reminders = await remindersService.listReminders(userId, type);
    res.json({ success: true, data: reminders });
  }
});

export const createReminder = asyncHandler(async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;
  const data = createSchema.parse(req.body);
  const reminder = await remindersService.createReminder(userId, {
    ...data,
    dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
  });
  res.status(201).json({ success: true, data: reminder });
});

export const updateReminder = asyncHandler(async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;
  const data = updateSchema.parse(req.body);
  const reminder = await remindersService.updateReminder(
    getParam(req.params.id),
    userId,
    {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    },
  );
  res.json({ success: true, data: reminder });
});

export const deleteReminder = asyncHandler(async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;
  const result = await remindersService.deleteReminder(getParam(req.params.id), userId);
  if (!result) {
    throw new NotFoundError("Reminder not found");
  }
  res.json({ success: true });
});

export const generateReminders = asyncHandler(async (req, res) => {
  const userId = (req as AuthenticatedRequest).userId;
  const result = await remindersService.generateReminders(userId);
  res.json({ success: true, data: result });
});
