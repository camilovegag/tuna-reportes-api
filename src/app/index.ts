import { Hono } from "hono";
import pingRouter from "../routers/ping.router";
import eventsRouter from "../routers/events.router";
import authRouter from "../routers/auth.router";
import membersRouter from "../routers/members.router";

const app = new Hono();

app.route("/ping", pingRouter);
app.route("/events", eventsRouter);
app.route("/members", membersRouter);
app.route("/auth", authRouter);

export default app;
