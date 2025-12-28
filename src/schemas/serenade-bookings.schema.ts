import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { serenadeBookings } from "../db/schema";

export const serenadeBookingSelectSchema = createSelectSchema(serenadeBookings);

export const serenadeBookingInsertSchema = createInsertSchema(serenadeBookings)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .refine((data) => data.price >= 0, {
    message: "Price must be non-negative",
    path: ["price"],
  })
  .refine(
    (data) =>
      data.transportationCost === undefined ||
      data.transportationCost === null ||
      data.transportationCost >= 0,
    {
      message: "Transportation cost must be non-negative",
      path: ["transportationCost"],
    },
  );

export const serenadeBookingUpdateSchema =
  serenadeBookingInsertSchema.partial();

export const serenadeBookingIdSchema = z.object({
  id: z.string().uuid(),
});
