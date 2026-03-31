import { Router, type Router as RouterType } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { getRoles, getRole, createRole, updateRole, deleteRole, setPermissions } from "../controllers/roles.js";

export const rolesRouter: RouterType = Router();

rolesRouter.use(authenticate);

rolesRouter.get("/", authorize("role.read"), getRoles);
rolesRouter.post("/", authorize("role.create"), createRole);
rolesRouter.get("/:id", authorize("role.read"), getRole);
rolesRouter.put("/:id", authorize("role.update"), updateRole);
rolesRouter.delete("/:id", authorize("role.delete"), deleteRole);
rolesRouter.put("/:id/permissions", authorize("role.update"), setPermissions);
