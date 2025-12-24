import { dbSchema } from "../db";

export type SerenadeBooking = typeof dbSchema.serenadeBookings.$inferSelect;

export type SerenadeBookingInsert =
  typeof dbSchema.serenadeBookings.$inferInsert;

export type SerenadeBookingUpdate = Partial<
  Omit<SerenadeBookingInsert, "id" | "createdAt" | "updatedAt">
>;

export type SerenadeBookingsGetResponse = {
  items: SerenadeBooking[];
  count: number;
};
