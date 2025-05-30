import { Hono } from "hono";
import {
  createEventController,
  getEventController,
  getEventsController,
  updateEventController,
} from "../controllers/events.controller";

const eventsRouter = new Hono();

eventsRouter.get("/:id", getEventController);
eventsRouter.get("/", getEventsController);
eventsRouter.post("/", createEventController);
eventsRouter.patch("/:id", updateEventController);

export default eventsRouter;
