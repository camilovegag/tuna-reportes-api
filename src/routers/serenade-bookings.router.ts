import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { ROLES } from "../types/roles";
import {
  getSerenadeBookings,
  getSerenadeBookingById,
  createSerenadeBooking,
  updateSerenadeBooking,
  deleteSerenadeBooking,
} from "../controllers/serenade-bookings.controller";
import {
  serenadeBookingInsertSchema,
  serenadeBookingUpdateSchema,
} from "../schemas/serenade-bookings.schema";
import { validatorErrorHandler } from "../utils/validator";

const serenadeBookingsRouter = new Hono()
  .get("/", authMiddleware, getSerenadeBookings)
  .get("/:id", authMiddleware, getSerenadeBookingById)
  .post(
    "/",
    authMiddleware,
    requireRole([ROLES.ADMIN, ROLES.EDITOR]),
    zValidator("json", serenadeBookingInsertSchema, validatorErrorHandler),
    createSerenadeBooking,
  )
  .patch(
    "/:id",
    authMiddleware,
    requireRole([ROLES.ADMIN, ROLES.EDITOR]),
    zValidator("json", serenadeBookingUpdateSchema, validatorErrorHandler),
    updateSerenadeBooking,
  )
  .delete(
    "/:id",
    authMiddleware,
    requireRole([ROLES.ADMIN]),
    deleteSerenadeBooking,
  );

export default serenadeBookingsRouter;
export type SerenadeBookingsRouterType = typeof serenadeBookingsRouter;
