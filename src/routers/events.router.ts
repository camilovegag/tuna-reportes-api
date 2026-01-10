import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  createEventController,
  getEventController,
  getEventsController,
  updateEventController,
} from "../controllers/events.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { ROLES } from "../types/roles";
import { eventInsertSchema, eventUpdateSchema } from "../schemas/events.schema";
import { validatorErrorHandler } from "../utils/validator";

const eventsRouter = new Hono()
  .get("/:id", authMiddleware, async (c) => {
    return getEventController(c);
  })
  .get("/", authMiddleware, async (c) => {
    return getEventsController(c);
  })
  .post(
    "/",
    authMiddleware,
    requireRole([ROLES.ADMIN, ROLES.EDITOR]),
    zValidator("json", eventInsertSchema, validatorErrorHandler),
    async (c) => {
      return createEventController(c);
    },
  )
  .patch(
    "/:id",
    authMiddleware,
    requireRole([ROLES.ADMIN, ROLES.EDITOR]),
    zValidator("json", eventUpdateSchema, validatorErrorHandler),
    async (c) => {
      return updateEventController(c);
    },
  );

export default eventsRouter;
export type EventsRouterType = typeof eventsRouter;
