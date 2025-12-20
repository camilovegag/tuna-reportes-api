import { Hono } from "hono";
import { cors } from "hono/cors";
import authRouter from "../routers/auth.router";
import eventsRouter from "../routers/events.router";
import membersRouter from "../routers/members.router";
import pingRouter from "../routers/ping.router";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: "http://localhost:5173",
  }),
);

app.route("/ping", pingRouter);
app.route("/events", eventsRouter);
app.route("/members", membersRouter);
app.route("/auth", authRouter);

export default app;
