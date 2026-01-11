import { Hono } from "hono";
import {
  getMeController,
  getUserController,
  getUsersController,
  updateUserController,
} from "../controllers/users.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { ROLES } from "../types/roles";

const usersRouter = new Hono();

// Own profile: all authenticated users
usersRouter.get("/me", authMiddleware, getMeController);

// List all users: admin only
usersRouter.get(
  "/",
  authMiddleware,
  requireRole([ROLES.ADMIN]),
  getUsersController,
);

// View/Update any user: admin only
usersRouter.get(
  "/:id",
  authMiddleware,
  requireRole([ROLES.ADMIN]),
  getUserController,
);
usersRouter.patch(
  "/:id",
  authMiddleware,
  requireRole([ROLES.ADMIN]),
  updateUserController,
);

export default usersRouter;
