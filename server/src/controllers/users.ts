import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as usersService from "../services/users.js";
import { getParam } from "../utils/params.js";

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  isActive: z.boolean().optional(),
});

const assignRolesSchema = z.object({
  roleIds: z.array(z.string()),
});

export async function getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string | undefined;

    const result = await usersService.listUsers(page, limit, search);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

export async function getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await usersService.getUserById(getParam(req.params.id));
    if (!user) {
      res.status(404).json({ success: false, error: "User not found" });
      return;
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = updateUserSchema.parse(req.body);
    const user = await usersService.updateUser(getParam(req.params.id), data);
    res.json({ success: true, data: user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors.map((e) => e.message).join(", ") });
      return;
    }
    next(error);
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await usersService.deactivateUser(getParam(req.params.id));
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
}

export async function assignRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { roleIds } = assignRolesSchema.parse(req.body);
    const user = await usersService.assignRoles(getParam(req.params.id), roleIds);
    res.json({ success: true, data: user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors.map((e) => e.message).join(", ") });
      return;
    }
    next(error);
  }
}
