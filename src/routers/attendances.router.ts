import { Hono } from "hono";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { jsonValidator } from "../middlewares/validation.middleware";
import {
  attendanceInsertSchema,
  attendanceUpdateSchema,
} from "../schemas/attendances.schema";
import {
  createAttendance,
  deleteAttendance,
  getAttendanceById,
  getAttendances,
  updateAttendance,
} from "../services/attendances.service";
import { ROLES } from "../types/roles";

const attendancesRouter = new Hono()
  .get("/", authMiddleware, async (c) => {
    const filters = {
      eventId: c.req.query("eventId"),
      memberId: c.req.query("memberId"),
    };

    const result = await getAttendances(filters);

    if (!result.success) {
      return c.json({ error: result.error }, result.status);
    }

    return c.json(result.data, 200);
  })
  .get("/:id", authMiddleware, async (c) => {
    const id = c.req.param("id");
    const result = await getAttendanceById(id);

    if (!result.success) {
      return c.json({ error: result.error }, result.status);
    }

    return c.json(result.data, 200);
  })
  .post(
    "/",
    authMiddleware,
    requireRole([ROLES.ADMIN, ROLES.EDITOR]),
    jsonValidator(attendanceInsertSchema),
    async (c) => {
      const body = c.req.valid("json");
      const user = c.get("user");

      const result = await createAttendance(body, user.userId);

      if (!result.success) {
        return c.json({ error: result.error }, result.status);
      }

      return c.json(result.data, 201);
    },
  )
  .patch(
    "/:id",
    authMiddleware,
    requireRole([ROLES.ADMIN, ROLES.EDITOR]),
    jsonValidator(attendanceUpdateSchema),
    async (c) => {
      const id = c.req.param("id");
      const body = c.req.valid("json");
      const user = c.get("user");

      const result = await updateAttendance(id, body, user.userId);

      if (!result.success) {
        return c.json({ error: result.error }, result.status);
      }

      return c.json(result.data, 200);
    },
  )
  .delete("/:id", authMiddleware, requireRole([ROLES.ADMIN]), async (c) => {
    const id = c.req.param("id");
    const result = await deleteAttendance(id);

    if (!result.success) {
      return c.json({ error: result.error }, result.status);
    }

    return c.json(result.data, 200);
  });

export default attendancesRouter;
export type AttendancesRouterType = typeof attendancesRouter;
