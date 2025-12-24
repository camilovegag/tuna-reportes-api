import { authMiddleware } from "../middlewares/auth.middleware";
import { Hono } from "hono";
import {
  getSerenadeBookings,
  getSerenadeBookingById,
  createSerenadeBooking,
  updateSerenadeBooking,
  deleteSerenadeBooking,
} from "../controllers/serenade-bookings.controller";

const serenadeBookingsRouter = new Hono();

serenadeBookingsRouter.get("/", authMiddleware, getSerenadeBookings);
serenadeBookingsRouter.get("/:id", authMiddleware, getSerenadeBookingById);
serenadeBookingsRouter.post("/", authMiddleware, createSerenadeBooking);
serenadeBookingsRouter.patch("/:id", authMiddleware, updateSerenadeBooking);
serenadeBookingsRouter.delete("/:id", authMiddleware, deleteSerenadeBooking);

export default serenadeBookingsRouter;
