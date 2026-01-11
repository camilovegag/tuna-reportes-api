import { Hono } from "hono";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { jsonValidator } from "../middlewares/validation.middleware";
import { userUpdateSchema } from "../schemas/users.schema";
import {
  getCurrentUser,
  getUserById,
  getUsers,
  updateUser,
} from "../services/users.service";
import { ROLES } from "../types/roles";

const usersRouter = new Hono()
  .get("/me", authMiddleware, async (c) => {
    const user = c.get("user");
    const result = await getCurrentUser(user.userId);

    if (!result.success) {
      return c.json({ error: result.error }, result.status);
    }

    return c.json(result.data, 200);
  })
  .get("/", authMiddleware, requireRole([ROLES.ADMIN]), async (c) => {
    const result = await getUsers();

    if (!result.success) {
      return c.json({ error: result.error }, result.status);
    }

    return c.json(result.data, 200);
  })
  .get("/:id", authMiddleware, requireRole([ROLES.ADMIN]), async (c) => {
    const id = c.req.param("id");
    const result = await getUserById(id);

    if (!result.success) {
      return c.json({ error: result.error }, result.status);
    }

    return c.json(result.data, 200);
  })
  .patch(
    "/:id",
    authMiddleware,
    requireRole([ROLES.ADMIN]),
    jsonValidator(userUpdateSchema),
    async (c) => {
      const id = c.req.param("id");
      const body = c.req.valid("json");
      const result = await updateUser(id, body);

      if (!result.success) {
        return c.json({ error: result.error }, result.status);
      }

      return c.json(result.data, 200);
    },
  );

export default usersRouter;
export type UsersRouterType = typeof usersRouter;
