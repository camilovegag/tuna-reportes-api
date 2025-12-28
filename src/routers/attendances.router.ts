import { Hono } from "hono";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { ROLES } from "../types/roles";
import {
  createAttendanceController,
  deleteAttendanceController,
  getAttendanceController,
  getAttendancesController,
  updateAttendanceController,
} from "../controllers/attendances.controller";

const attendancesRouter = new Hono();

// Read: all authenticated users
attendancesRouter.get("/", authMiddleware, getAttendancesController);
attendancesRouter.get("/:id", authMiddleware, getAttendanceController);

// Create/Update: admin and editor
attendancesRouter.post(
  "/",
  authMiddleware,
  requireRole([ROLES.ADMIN, ROLES.EDITOR]),
  createAttendanceController,
);
attendancesRouter.patch(
  "/:id",
  authMiddleware,
  requireRole([ROLES.ADMIN, ROLES.EDITOR]),
  updateAttendanceController,
);

// Delete: admin only
attendancesRouter.delete(
  "/:id",
  authMiddleware,
  requireRole([ROLES.ADMIN]),
  deleteAttendanceController,
);

export default attendancesRouter;
