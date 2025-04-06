import { Hono } from "hono";
import pingRoute from "../routes/ping.route";

const app = new Hono();

app.route("/", pingRoute);

export default app;
