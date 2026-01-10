import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
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
import {
  memberInsertSchema,
  memberUpdateSchema,
} from "../schemas/members.schema";
import { validatorErrorHandler } from "../utils/validator";

const membersRouter = new Hono()
  .get("/registration", getMembersForRegistrationController)
  .get("/", authMiddleware, getMembersController)
  .get("/:id", authMiddleware, getMemberController)
  .post(
    "/",
    authMiddleware,
    requireRole([ROLES.ADMIN]),
    zValidator("json", memberInsertSchema, validatorErrorHandler),
    postMemberController,
  )
  .patch(
    "/:id",
    authMiddleware,
    requireRole([ROLES.ADMIN]),
    zValidator("json", memberUpdateSchema, validatorErrorHandler),
    patchMemberController,
  )
  .delete(
    "/:id",
    authMiddleware,
    requireRole([ROLES.ADMIN]),
    deleteMemberController,
  );

export default membersRouter;
export type MembersRouterType = typeof membersRouter;
