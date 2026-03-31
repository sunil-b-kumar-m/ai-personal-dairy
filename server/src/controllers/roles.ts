import { z } from "zod";
import * as rolesService from "../services/roles.js";
import { getParam } from "../utils/params.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { NotFoundError, ValidationError } from "../utils/errors.js";

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

export const getRoles = asyncHandler(async (_req, res) => {
  const roles = await rolesService.listRoles();
  const data = roles.map((role) => ({
    ...role,
    permissions: role.permissions.map((rp) => rp.permission),
  }));
  res.json({ success: true, data });
});

export const getRole = asyncHandler(async (req, res) => {
  const role = await rolesService.getRoleById(getParam(req.params.id));
  if (!role) {
    throw new NotFoundError("Role not found");
  }
  res.json({
    success: true,
    data: {
      ...role,
      permissions: role.permissions.map((rp) => rp.permission),
    },
  });
});

export const createRole = asyncHandler(async (req, res) => {
  const data = createRoleSchema.parse(req.body);
  const role = await rolesService.createRole(data);
  res.status(201).json({
    success: true,
    data: {
      ...role,
      permissions: role.permissions.map((rp) => rp.permission),
    },
  });
});

export const updateRole = asyncHandler(async (req, res) => {
  const data = updateRoleSchema.parse(req.body);
  const role = await rolesService.updateRole(getParam(req.params.id), data);
  res.json({
    success: true,
    data: {
      ...role,
      permissions: role.permissions.map((rp) => rp.permission),
    },
  });
});

export const deleteRole = asyncHandler(async (req, res) => {
  try {
    const result = await rolesService.deleteRole(getParam(req.params.id));
    if (!result) {
      throw new NotFoundError("Role not found");
    }
    res.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Cannot delete")) {
      throw new ValidationError(error.message);
    }
    throw error;
  }
});

export const setPermissions = asyncHandler(async (req, res) => {
  const { permissionIds } = setPermissionsSchema.parse(req.body);
  const role = await rolesService.setRolePermissions(getParam(req.params.id), permissionIds);
  if (!role) {
    throw new NotFoundError("Role not found");
  }
  res.json({
    success: true,
    data: {
      ...role,
      permissions: role.permissions.map((rp) => rp.permission),
    },
  });
});
