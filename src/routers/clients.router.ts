import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { ROLES } from "../types/roles";
import {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
} from "../controllers/clients.controller";
import {
  clientInsertSchema,
  clientUpdateSchema,
} from "../schemas/clients.schema";
import { validatorErrorHandler } from "../utils/validator";

const clientsRouter = new Hono()
  .get("/", authMiddleware, getClients)
  .get("/:id", authMiddleware, getClientById)
  .post(
    "/",
    authMiddleware,
    requireRole([ROLES.ADMIN, ROLES.EDITOR]),
    zValidator("json", clientInsertSchema, validatorErrorHandler),
    createClient,
  )
  .patch(
    "/:id",
    authMiddleware,
    requireRole([ROLES.ADMIN, ROLES.EDITOR]),
    zValidator("json", clientUpdateSchema, validatorErrorHandler),
    updateClient,
  )
  .delete("/:id", authMiddleware, requireRole([ROLES.ADMIN]), deleteClient);

export default clientsRouter;
export type ClientsRouterType = typeof clientsRouter;
