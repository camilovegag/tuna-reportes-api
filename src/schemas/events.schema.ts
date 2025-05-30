import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { dbSchema } from "../db";

export const eventInsertSchema = createInsertSchema(dbSchema.events, {
  name: (schema) => schema.nonempty("Name cannot be empty."),
  date: (schema) => schema.nonempty("Date cannot be empty."),
  location: (schema) => schema.nonempty("Location cannot be empty."),
});

export const eventSelectSchema = createSelectSchema(dbSchema.events);
