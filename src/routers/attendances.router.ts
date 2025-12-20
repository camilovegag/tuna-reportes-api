import { Hono } from "hono";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  createAttendanceController,
  deleteAttendanceController,
  getAttendanceController,
  getAttendancesController,
  updateAttendanceController,
} from "../controllers/attendances.controller";

const attendancesRouter = new Hono();

attendancesRouter.get("/", authMiddleware, getAttendancesController);
attendancesRouter.get("/:id", authMiddleware, getAttendanceController);
attendancesRouter.post("/", authMiddleware, createAttendanceController);
attendancesRouter.patch("/:id", authMiddleware, updateAttendanceController);
attendancesRouter.delete("/:id", authMiddleware, deleteAttendanceController);

export default attendancesRouter;
