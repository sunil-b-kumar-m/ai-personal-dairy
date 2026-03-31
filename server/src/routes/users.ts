import { Router, type Router as RouterType } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { getUsers, getUser, updateUser, deleteUser, assignRoles } from "../controllers/users.js";

export const usersRouter: RouterType = Router();

usersRouter.use(authenticate);

usersRouter.get("/", authorize("user.read"), getUsers);
usersRouter.get("/:id", authorize("user.read"), getUser);
usersRouter.put("/:id", authorize("user.update"), updateUser);
usersRouter.delete("/:id", authorize("user.delete"), deleteUser);
usersRouter.put("/:id/roles", authorize("user.update"), assignRoles);
