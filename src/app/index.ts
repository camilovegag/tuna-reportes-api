import { Hono } from "hono";
import { cors } from "hono/cors";
import authRouter from "../routers/auth.router";
import eventsRouter from "../routers/events.router";
import membersRouter from "../routers/members.router";
import pingRouter from "../routers/ping.router";
import attendancesRouter from "../routers/attendances.router";
import usersRouter from "../routers/users.router";
import clientsRouter from "../routers/clients.router";
import serenadeBookingsRouter from "../routers/serenade-bookings.router";

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
app.route("/attendances", attendancesRouter);
app.route("/users", usersRouter);
app.route("/clients", clientsRouter);
app.route("/serenade-bookings", serenadeBookingsRouter);

export default app;
