import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { loginSchema, registerSchema } from "../schemas/auth.schema";
import { loginHandler, registerHandler } from "../controllers/auth.controller";
import { validatorErrorHandler } from "../utils/validator";

const authRouter = new Hono()
  .post(
    "/register",
    zValidator("json", registerSchema, validatorErrorHandler),
    registerHandler,
  )
  .post(
    "/login",
    zValidator("json", loginSchema, validatorErrorHandler),
    loginHandler,
  );

export default authRouter;
export type AuthRouterType = typeof authRouter;
