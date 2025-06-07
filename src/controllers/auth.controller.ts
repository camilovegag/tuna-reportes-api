import type { Context } from "hono";

export default async function postRegisterController(c: Context) {
  const body = await c.req.json();
  console.log("🚀 ~ postRegisterController ~ body:", body);

  return c.json({ id: "uuid", message: "User created" }, 201);
}
