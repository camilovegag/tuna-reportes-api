import { Hono } from "hono";

const pingRoute = new Hono();

pingRoute.get("/ping", (c) => {
  return c.json({ message: "pong 🏓" });
});

export default pingRoute;
