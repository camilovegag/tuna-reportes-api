import { Hono } from "hono";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { jsonValidator } from "../middlewares/validation.middleware";
import {
  clientInsertSchema,
  clientUpdateSchema,
} from "../schemas/clients.schema";
import {
  createClient,
  deleteClient,
  getClientById,
  getClients,
  updateClient,
} from "../services/clients.service";
import { ROLES } from "../types/roles";

const clientsRouter = new Hono()
  .get("/", authMiddleware, async (c) => {
    const result = await getClients();

    if (!result.success) {
      return c.json({ error: result.error }, result.status);
    }

    return c.json(result.data, 200);
  })
  .get("/:id", authMiddleware, async (c) => {
    const id = c.req.param("id");
    const result = await getClientById(id);

    if (!result.success) {
      return c.json({ error: result.error }, result.status);
    }

    return c.json(result.data, 200);
  })
  .post(
    "/",
    authMiddleware,
    requireRole([ROLES.ADMIN, ROLES.EDITOR]),
    jsonValidator(clientInsertSchema),
    async (c) => {
      const body = c.req.valid("json");
      const result = await createClient(body);

      if (!result.success) {
        return c.json({ error: result.error }, result.status);
      }

      return c.json(result.data, 201);
    },
  )
  .patch(
    "/:id",
    authMiddleware,
    requireRole([ROLES.ADMIN, ROLES.EDITOR]),
    jsonValidator(clientUpdateSchema),
    async (c) => {
      const id = c.req.param("id");
      const body = c.req.valid("json");
      const result = await updateClient(id, body);

      if (!result.success) {
        return c.json({ error: result.error }, result.status);
      }

      return c.json(result.data, 200);
    },
  )
  .delete("/:id", authMiddleware, requireRole([ROLES.ADMIN]), async (c) => {
    const id = c.req.param("id");
    const result = await deleteClient(id);

    if (!result.success) {
      return c.json({ error: result.error }, result.status);
    }

    return c.json(result.data, 200);
  });

export default clientsRouter;
export type ClientsRouterType = typeof clientsRouter;
