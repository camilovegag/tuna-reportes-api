import { Hono } from "hono";

const pingRouter = new Hono().get("/", (c) => {
  return c.json({ message: "pong 🏓" });
});

export default pingRouter;
export type PingRouterType = typeof pingRouter;
