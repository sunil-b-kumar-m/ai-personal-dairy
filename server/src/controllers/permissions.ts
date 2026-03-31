import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as permissionsService from "../services/permissions.js";
import { getParam } from "../utils/params.js";

const createPermissionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(200).optional(),
  module: z.string().min(1).max(50),
});

const updatePermissionSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(200).optional(),
  module: z.string().min(1).max(50).optional(),
});

export async function getPermissions(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await permissionsService.listPermissions();
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function createPermission(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createPermissionSchema.parse(req.body);
    const permission = await permissionsService.createPermission(data);
    res.status(201).json({ success: true, data: permission });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors.map((e) => e.message).join(", ") });
      return;
    }
    next(error);
  }
}

export async function updatePermission(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = updatePermissionSchema.parse(req.body);
    const permission = await permissionsService.updatePermission(getParam(req.params.id), data);
    res.json({ success: true, data: permission });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors.map((e) => e.message).join(", ") });
      return;
    }
    next(error);
  }
}

export async function deletePermission(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await permissionsService.deletePermission(getParam(req.params.id));
    if (!result) {
      res.status(404).json({ success: false, error: "Permission not found" });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Cannot delete")) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }
    next(error);
  }
}
