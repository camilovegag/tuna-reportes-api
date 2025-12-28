import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { ROLES } from "../types/roles";
import { Hono } from "hono";
import {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
} from "../controllers/clients.controller";

const clientsRouter = new Hono();

// Read: all authenticated users
clientsRouter.get("/", authMiddleware, getClients);
clientsRouter.get("/:id", authMiddleware, getClientById);

// Create/Update: admin and editor
clientsRouter.post(
  "/",
  authMiddleware,
  requireRole([ROLES.ADMIN, ROLES.EDITOR]),
  createClient,
);
clientsRouter.patch(
  "/:id",
  authMiddleware,
  requireRole([ROLES.ADMIN, ROLES.EDITOR]),
  updateClient,
);

// Delete: admin only
clientsRouter.delete(
  "/:id",
  authMiddleware,
  requireRole([ROLES.ADMIN]),
  deleteClient,
);

export default clientsRouter;
