import { Hono } from "hono";
import {
  createEventController,
  getEventController,
  getEventsController,
  updateEventController,
} from "../controllers/events.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { ROLES } from "../types/roles";

const eventsRouter = new Hono();

// Read: all authenticated users
eventsRouter.get("/:id", authMiddleware, getEventController);
eventsRouter.get("/", authMiddleware, getEventsController);

// Create/Update: admin and editor
eventsRouter.post(
  "/",
  authMiddleware,
  requireRole([ROLES.ADMIN, ROLES.EDITOR]),
  createEventController,
);
eventsRouter.patch(
  "/:id",
  authMiddleware,
  requireRole([ROLES.ADMIN, ROLES.EDITOR]),
  updateEventController,
);

export default eventsRouter;
