import { Hono } from "hono";
import {
  postLoginController,
  postRegisterController,
} from "../controllers/auth.controller";

const authRouter = new Hono();

authRouter.post("/register", postRegisterController);
authRouter.post("/login", postLoginController);

export default authRouter;
