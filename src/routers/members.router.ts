import { Hono } from "hono";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  getMemberController,
  getMembersController,
  postMemberController,
} from "../controllers/members.controller";

const membersRouter = new Hono();

membersRouter.get("/", authMiddleware, getMembersController);
membersRouter.get("/:id", authMiddleware, getMemberController);
membersRouter.post("/", authMiddleware, postMemberController);

export default membersRouter;
