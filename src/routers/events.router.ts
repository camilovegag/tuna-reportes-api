import { Hono } from "hono";
import { createEventController } from "../controllers/events.controller";

const eventsRouter = new Hono();

eventsRouter.post("/", createEventController);

export default eventsRouter;
