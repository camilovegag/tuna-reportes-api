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
  .get("/:id", authMiddleware, getEventController)
  .get("/", authMiddleware, getEventsController)
  .post(
    "/",
    authMiddleware,
    requireRole([ROLES.ADMIN, ROLES.EDITOR]),
    zValidator("json", eventInsertSchema, validatorErrorHandler),
    createEventController,
  )
  .patch(
    "/:id",
    authMiddleware,
    requireRole([ROLES.ADMIN, ROLES.EDITOR]),
    zValidator("json", eventUpdateSchema, validatorErrorHandler),
    updateEventController,
  );

export default eventsRouter;
export type EventsRouterType = typeof eventsRouter;
