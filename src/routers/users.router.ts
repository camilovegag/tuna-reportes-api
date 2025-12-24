import { Hono } from "hono";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  getMeController,
  getUserController,
  getUsersController,
  updateUserController,
} from "../controllers/users.controller";

const usersRouter = new Hono();

usersRouter.get("/me", authMiddleware, getMeController);
usersRouter.get("/", authMiddleware, getUsersController);
usersRouter.get("/:id", authMiddleware, getUserController);
usersRouter.patch("/:id", authMiddleware, updateUserController);

export default usersRouter;
