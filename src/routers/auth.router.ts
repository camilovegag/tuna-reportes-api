import { Hono } from "hono";
import postRegisterController from "../controllers/auth.controller";

const authRouter = new Hono();

authRouter.post("/register", postRegisterController);

export default authRouter;
