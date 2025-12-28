import { Hono } from "hono";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { ROLES } from "../types/roles";
import {
  deleteMemberController,
  getMemberController,
  getMembersController,
  getMembersForRegistrationController,
  patchMemberController,
  postMemberController,
} from "../controllers/members.controller";

const membersRouter = new Hono();

// Public: member list for registration (no auth required)
membersRouter.get("/registration", getMembersForRegistrationController);

// Protected: read access for all authenticated users
membersRouter.get("/", authMiddleware, getMembersController);
membersRouter.get("/:id", authMiddleware, getMemberController);

// Admin only: write operations
membersRouter.post(
  "/",
  authMiddleware,
  requireRole([ROLES.ADMIN]),
  postMemberController,
);
membersRouter.patch(
  "/:id",
  authMiddleware,
  requireRole([ROLES.ADMIN]),
  patchMemberController,
);
membersRouter.delete(
  "/:id",
  authMiddleware,
  requireRole([ROLES.ADMIN]),
  deleteMemberController,
);

export default membersRouter;
