import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { serenadeBookings } from "../db/schema";

export const serenadeBookingSelectSchema = createSelectSchema(serenadeBookings);

export const serenadeBookingInsertSchema = createInsertSchema(
  serenadeBookings,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const serenadeBookingUpdateSchema =
  serenadeBookingInsertSchema.partial();

export const serenadeBookingIdSchema = z.object({
  id: z.string().uuid(),
});
