import { Router, type Router as RouterType } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { getPermissions, createPermission, updatePermission, deletePermission } from "../controllers/permissions.js";

export const permissionsRouter: RouterType = Router();

permissionsRouter.use(authenticate);

permissionsRouter.get("/", authorize("permission.read"), getPermissions);
permissionsRouter.post("/", authorize("permission.create"), createPermission);
permissionsRouter.put("/:id", authorize("permission.update"), updatePermission);
permissionsRouter.delete("/:id", authorize("permission.delete"), deletePermission);
