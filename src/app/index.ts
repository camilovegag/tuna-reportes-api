import { Hono } from "hono";
import pingRouter from "../routers/ping.router";
import eventsRouter from "../routers/events.router";
import authRouter from "../routers/auth.router";

const app = new Hono();

app.route("/ping", pingRouter);
app.route("/events", eventsRouter);
app.route("/auth", authRouter);

export default app;
