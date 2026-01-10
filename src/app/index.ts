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

const app = new Hono()
  .use(
    "*",
    cors({
      origin: "http://localhost:5173",
    }),
  )
  .route("/ping", pingRouter)
  .route("/events", eventsRouter)
  .route("/members", membersRouter)
  .route("/auth", authRouter)
  .route("/attendances", attendancesRouter)
  .route("/users", usersRouter)
  .route("/clients", clientsRouter)
  .route("/serenade-bookings", serenadeBookingsRouter);

export default app;
export type AppType = typeof app;
