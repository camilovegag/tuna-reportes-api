import { Hono } from "hono";
import {
  createEventController,
  getEventsController,
} from "../controllers/events.controller";

const eventsRouter = new Hono();

eventsRouter.get("/", getEventsController);
eventsRouter.post("/", createEventController);

export default eventsRouter;
