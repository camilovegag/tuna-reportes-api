import { Hono } from "hono";
import {
  createEventController,
  getEventController,
  getEventsController,
} from "../controllers/events.controller";

const eventsRouter = new Hono();

eventsRouter.get("/:id", getEventController);
eventsRouter.get("/", getEventsController);
eventsRouter.post("/", createEventController);

export default eventsRouter;
