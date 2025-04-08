import { Hono } from "hono";
import pingRouter from "../routers/ping.router";
import eventsRouter from "../routers/events.router";

const app = new Hono();

app.route("/ping", pingRouter);
app.route("/events", eventsRouter);

export default app;
