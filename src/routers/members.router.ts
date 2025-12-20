import { Hono } from "hono";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  deleteMemberController,
  getMemberController,
  getMembersController,
  patchMemberController,
  postMemberController,
} from "../controllers/members.controller";

const membersRouter = new Hono();

membersRouter.get("/", authMiddleware, getMembersController);
membersRouter.get("/:id", authMiddleware, getMemberController);
membersRouter.post("/", authMiddleware, postMemberController);
membersRouter.patch("/:id", authMiddleware, patchMemberController);
membersRouter.delete("/:id", authMiddleware, deleteMemberController);

export default membersRouter;
