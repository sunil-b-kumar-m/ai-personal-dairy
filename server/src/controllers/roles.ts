import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import * as rolesService from "../services/roles.js";
import { getParam } from "../utils/params.js";

const createRoleSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(200).optional(),
  isDefault: z.boolean().optional(),
});

const updateRoleSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  description: z.string().max(200).optional(),
  isDefault: z.boolean().optional(),
});

const setPermissionsSchema = z.object({
  permissionIds: z.array(z.string()),
});

export async function getRoles(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const roles = await rolesService.listRoles();
    const data = roles.map((role) => ({
      ...role,
      permissions: role.permissions.map((rp) => rp.permission),
    }));
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const role = await rolesService.getRoleById(getParam(req.params.id));
    if (!role) {
      res.status(404).json({ success: false, error: "Role not found" });
      return;
    }
    res.json({
      success: true,
      data: {
        ...role,
        permissions: role.permissions.map((rp) => rp.permission),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = createRoleSchema.parse(req.body);
    const role = await rolesService.createRole(data);
    res.status(201).json({
      success: true,
      data: {
        ...role,
        permissions: role.permissions.map((rp) => rp.permission),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors.map((e) => e.message).join(", ") });
      return;
    }
    next(error);
  }
}

export async function updateRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = updateRoleSchema.parse(req.body);
    const role = await rolesService.updateRole(getParam(req.params.id), data);
    res.json({
      success: true,
      data: {
        ...role,
        permissions: role.permissions.map((rp) => rp.permission),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors.map((e) => e.message).join(", ") });
      return;
    }
    next(error);
  }
}

export async function deleteRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await rolesService.deleteRole(getParam(req.params.id));
    if (!result) {
      res.status(404).json({ success: false, error: "Role not found" });
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

export async function setPermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { permissionIds } = setPermissionsSchema.parse(req.body);
    const role = await rolesService.setRolePermissions(getParam(req.params.id), permissionIds);
    if (!role) {
      res.status(404).json({ success: false, error: "Role not found" });
      return;
    }
    res.json({
      success: true,
      data: {
        ...role,
        permissions: role.permissions.map((rp) => rp.permission),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.errors.map((e) => e.message).join(", ") });
      return;
    }
    next(error);
  }
}
