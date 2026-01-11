import { Hono } from "hono";
import { jsonValidator } from "../middlewares/validation.middleware";
import { loginSchema, registerSchema } from "../schemas/auth.schema";
import { loginUser, registerUser } from "../services/auth.service";

const authRouter = new Hono()
  .post("/register", jsonValidator(registerSchema), async (c) => {
    const body = c.req.valid("json");
    const result = await registerUser(body);

    if (!result.success) {
      return c.json({ error: result.error }, result.status);
    }

    return c.json(result.data, 201);
  })
  .post("/login", jsonValidator(loginSchema), async (c) => {
    const body = c.req.valid("json");
    const result = await loginUser(body);

    if (!result.success) {
      return c.json({ error: result.error }, result.status);
    }

    return c.json(result.data, 200);
  });

export default authRouter;
export type AuthRouterType = typeof authRouter;
