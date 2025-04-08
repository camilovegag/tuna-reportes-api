import type { MiddlewareHandler } from "hono";

export const mockAuth: MiddlewareHandler = async (c, next) => {
  c.set("user", {
    id: "user-123",
    role: "editor",
    email: "camilo@tuna.com",
  });
  await next();
};
