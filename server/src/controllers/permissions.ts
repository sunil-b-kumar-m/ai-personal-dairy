import { z } from "zod";
import * as permissionsService from "../services/permissions.js";
import { getParam } from "../utils/params.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { NotFoundError, ValidationError } from "../utils/errors.js";

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

export const getPermissions = asyncHandler(async (_req, res) => {
  const result = await permissionsService.listPermissions();
  res.json({ success: true, data: result });
});

export const createPermission = asyncHandler(async (req, res) => {
  const data = createPermissionSchema.parse(req.body);
  const permission = await permissionsService.createPermission(data);
  res.status(201).json({ success: true, data: permission });
});

export const updatePermission = asyncHandler(async (req, res) => {
  const data = updatePermissionSchema.parse(req.body);
  const permission = await permissionsService.updatePermission(getParam(req.params.id), data);
  res.json({ success: true, data: permission });
});

export const deletePermission = asyncHandler(async (req, res) => {
  try {
    const result = await permissionsService.deletePermission(getParam(req.params.id));
    if (!result) {
      throw new NotFoundError("Permission not found");
    }
    res.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Cannot delete")) {
      throw new ValidationError(error.message);
    }
    throw error;
  }
});
