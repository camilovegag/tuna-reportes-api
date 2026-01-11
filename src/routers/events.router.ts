import { Hono } from "hono";
import { jsonValidator } from "../middlewares/validation.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { ROLES } from "../types/roles";
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
} from "../services/events.service";
import { eventInsertSchema, eventUpdateSchema } from "../schemas/events.schema";

const eventsRouter = new Hono()
  .get("/", authMiddleware, async (c) => {
    const filters = {
      status: c.req.query("status"),
      type: c.req.query("type"),
      from: c.req.query("from"),
      to: c.req.query("to"),
      limit: c.req.query("limit"),
      offset: c.req.query("offset"),
    };

    const result = await getEvents(filters);

    if (!result.success) {
      return c.json({ error: result.error }, result.status);
    }

    return c.json(result.data, 200);
  })
  .get("/:id", authMiddleware, async (c) => {
    const id = c.req.param("id");
    const result = await getEventById(id);

    if (!result.success) {
      return c.json({ error: result.error }, result.status);
    }

    return c.json(result.data, 200);
  })
  .post(
    "/",
    authMiddleware,
    requireRole([ROLES.ADMIN, ROLES.EDITOR]),
    jsonValidator(eventInsertSchema),
    async (c) => {
      const body = c.req.valid("json");
      const user = c.get("user");

      const result = await createEvent(body, user.userId);

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
    jsonValidator(eventUpdateSchema),
    async (c) => {
      const id = c.req.param("id");
      const body = c.req.valid("json");
      const user = c.get("user");

      const result = await updateEvent(id, body, user.userId);

      if (!result.success) {
        return c.json({ error: result.error }, result.status);
      }

      return c.json(result.data, 200);
    },
  );

export default eventsRouter;
export type EventsRouterType = typeof eventsRouter;
