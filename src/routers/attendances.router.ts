import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { ROLES } from "../types/roles";
import {
  getAttendancesController,
  getAttendanceController,
  createAttendanceController,
  updateAttendanceController,
  deleteAttendanceController,
} from "../controllers/attendances.controller";
import {
  attendanceInsertSchema,
  attendanceUpdateSchema,
} from "../schemas/attendances.schema";
import { validatorErrorHandler } from "../utils/validator";

const attendancesRouter = new Hono()
  .get("/", authMiddleware, getAttendancesController)
  .get("/:id", authMiddleware, getAttendanceController)
  .post(
    "/",
    authMiddleware,
    requireRole([ROLES.ADMIN, ROLES.EDITOR]),
    zValidator("json", attendanceInsertSchema, validatorErrorHandler),
    createAttendanceController,
  )
  .patch(
    "/:id",
    authMiddleware,
    requireRole([ROLES.ADMIN, ROLES.EDITOR]),
    zValidator("json", attendanceUpdateSchema, validatorErrorHandler),
    updateAttendanceController,
  )
  .delete(
    "/:id",
    authMiddleware,
    requireRole([ROLES.ADMIN]),
    deleteAttendanceController,
  );

export default attendancesRouter;
export type AttendancesRouterType = typeof attendancesRouter;
