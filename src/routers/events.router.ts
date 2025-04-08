import { Hono } from "hono";

const eventsRouter = new Hono();

eventsRouter.post("/", (c) => {
  return c.json({ id: "some-uuid", message: "created" }, 201);
});

export default eventsRouter;
