import { Hono } from "hono";
import pingRoute from "../routes/ping.route";
import eventsRoute from "../routes/events.route";

const app = new Hono();

app.route("/", pingRoute);
app.route("/events", eventsRoute);

export default app;
