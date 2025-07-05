import { Hono } from "hono";
import {
  createEventController,
  getEventController,
  getEventsController,
  updateEventController,
} from "../controllers/events.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const eventsRouter = new Hono();

eventsRouter.get("/:id", authMiddleware, getEventController);
eventsRouter.get("/", authMiddleware, getEventsController);
eventsRouter.post("/", authMiddleware, createEventController);
eventsRouter.patch("/:id", authMiddleware, updateEventController);

export default eventsRouter;
