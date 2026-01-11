import { Hono } from "hono";
import { jsonValidator } from "../middlewares/validation.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { ROLES } from "../types/roles";
import {
  getSerenadeBookings,
  getSerenadeBookingById,
  createSerenadeBooking,
  updateSerenadeBooking,
  deleteSerenadeBooking,
} from "../services/serenade-bookings.service";
import {
  serenadeBookingInsertSchema,
  serenadeBookingUpdateSchema,
} from "../schemas/serenade-bookings.schema";

const serenadeBookingsRouter = new Hono()
  .get("/", authMiddleware, async (c) => {
    const result = await getSerenadeBookings();

    if (!result.success) {
      return c.json({ error: result.error }, result.status);
    }

    return c.json(result.data, 200);
  })
  .get("/:id", authMiddleware, async (c) => {
    const id = c.req.param("id");
    const result = await getSerenadeBookingById(id);

    if (!result.success) {
      return c.json({ error: result.error }, result.status);
    }

    return c.json(result.data, 200);
  })
  .post(
    "/",
    authMiddleware,
    requireRole([ROLES.ADMIN, ROLES.EDITOR]),
    jsonValidator(serenadeBookingInsertSchema),
    async (c) => {
      const body = c.req.valid("json");
      const result = await createSerenadeBooking(body);

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
    jsonValidator(serenadeBookingUpdateSchema),
    async (c) => {
      const id = c.req.param("id");
      const body = c.req.valid("json");
      const result = await updateSerenadeBooking(id, body);

      if (!result.success) {
        return c.json({ error: result.error }, result.status);
      }

      return c.json(result.data, 200);
    },
  )
  .delete("/:id", authMiddleware, requireRole([ROLES.ADMIN]), async (c) => {
    const id = c.req.param("id");
    const result = await deleteSerenadeBooking(id);

    if (!result.success) {
      return c.json({ error: result.error }, result.status);
    }

    return c.json(result.data, 200);
  });

export default serenadeBookingsRouter;
export type SerenadeBookingsRouterType = typeof serenadeBookingsRouter;
