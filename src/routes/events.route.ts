import { Hono } from "hono";

const eventsRoute = new Hono();

eventsRoute.post("/", (c) => {
  return c.json({ id: "some-uuid", message: "created" }, 201);
});

export default eventsRoute;
