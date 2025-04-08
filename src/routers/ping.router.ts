import { Hono } from "hono";

const pingRouter = new Hono();

pingRouter.get("/", (c) => {
  return c.json({ message: "pong 🏓" });
});

export default pingRouter;
