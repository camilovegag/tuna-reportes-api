import { Hono } from "hono";
import { jsonValidator } from "../middlewares/validation.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { ROLES } from "../types/roles";
import {
  getMembersForRegistration,
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deactivateMember,
} from "../services/members.service";
import {
  memberInsertSchema,
  memberUpdateSchema,
} from "../schemas/members.schema";

const membersRouter = new Hono()
  .get("/registration", async (c) => {
    const result = await getMembersForRegistration();

    if (!result.success) {
      return c.json({ error: result.error }, result.status);
    }

    return c.json(result.data, 200);
  })
  .get("/", authMiddleware, async (c) => {
    const result = await getMembers();

    if (!result.success) {
      return c.json({ error: result.error }, result.status);
    }

    return c.json(result.data, 200);
  })
  .get("/:id", authMiddleware, async (c) => {
    const id = c.req.param("id");
    const result = await getMemberById(id);

    if (!result.success) {
      return c.json({ error: result.error }, result.status);
    }

    return c.json(result.data, 200);
  })
  .post(
    "/",
    authMiddleware,
    requireRole([ROLES.ADMIN]),
    jsonValidator(memberInsertSchema),
    async (c) => {
      const body = c.req.valid("json");
      const result = await createMember(body);

      if (!result.success) {
        return c.json({ error: result.error }, result.status);
      }

      return c.json(result.data, 201);
    },
  )
  .patch(
    "/:id",
    authMiddleware,
    requireRole([ROLES.ADMIN]),
    jsonValidator(memberUpdateSchema),
    async (c) => {
      const id = c.req.param("id");
      const body = c.req.valid("json");
      const result = await updateMember(id, body);

      if (!result.success) {
        return c.json({ error: result.error }, result.status);
      }

      return c.json(result.data, 200);
    },
  )
  .delete("/:id", authMiddleware, requireRole([ROLES.ADMIN]), async (c) => {
    const id = c.req.param("id");
    const result = await deactivateMember(id);

    if (!result.success) {
      return c.json({ error: result.error }, result.status);
    }

    return c.json(result.data, 200);
  });

export default membersRouter;
export type MembersRouterType = typeof membersRouter;
