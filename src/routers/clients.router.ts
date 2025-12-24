import { authMiddleware } from "../middlewares/auth.middleware";
import { Hono } from "hono";
import {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
} from "../controllers/clients.controller";

const clientsRouter = new Hono();

clientsRouter.get("/", authMiddleware, getClients);
clientsRouter.get("/:id", authMiddleware, getClientById);
clientsRouter.post("/", authMiddleware, createClient);
clientsRouter.patch("/:id", authMiddleware, updateClient);
clientsRouter.delete("/:id", authMiddleware, deleteClient);

export default clientsRouter;
