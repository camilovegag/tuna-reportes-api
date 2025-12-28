import { authMiddleware } from "../middlewares/auth.middleware";
import { requireRole } from "../middlewares/role.middleware";
import { ROLES } from "../types/roles";
import { Hono } from "hono";
import {
  getSerenadeBookings,
  getSerenadeBookingById,
  createSerenadeBooking,
  updateSerenadeBooking,
  deleteSerenadeBooking,
} from "../controllers/serenade-bookings.controller";

const serenadeBookingsRouter = new Hono();

// Read: all authenticated users
serenadeBookingsRouter.get("/", authMiddleware, getSerenadeBookings);
serenadeBookingsRouter.get("/:id", authMiddleware, getSerenadeBookingById);

// Create/Update: admin and editor
serenadeBookingsRouter.post(
  "/",
  authMiddleware,
  requireRole([ROLES.ADMIN, ROLES.EDITOR]),
  createSerenadeBooking,
);
serenadeBookingsRouter.patch(
  "/:id",
  authMiddleware,
  requireRole([ROLES.ADMIN, ROLES.EDITOR]),
  updateSerenadeBooking,
);

// Delete: admin only
serenadeBookingsRouter.delete(
  "/:id",
  authMiddleware,
  requireRole([ROLES.ADMIN]),
  deleteSerenadeBooking,
);

export default serenadeBookingsRouter;
