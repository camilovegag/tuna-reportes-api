import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { ROLES } from "../types/roles";
import {
  getMeController,
  getUserController,
  getUsersController,
  updateUserController,
} from "../controllers/users.controller";
import { userUpdateSchema } from "../schemas/users.schema";
import { validatorErrorHandler } from "../utils/validator";

const usersRouter = new Hono()
  .get("/me", authMiddleware, getMeController)
  .get("/", authMiddleware, requireRole([ROLES.ADMIN]), getUsersController)
  .get("/:id", authMiddleware, requireRole([ROLES.ADMIN]), getUserController)
  .patch(
    "/:id",
    authMiddleware,
    requireRole([ROLES.ADMIN]),
    zValidator("json", userUpdateSchema, validatorErrorHandler),
    updateUserController,
  );

export default usersRouter;
export type UsersRouterType = typeof usersRouter;
