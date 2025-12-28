import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod/v4";
import { dbSchema } from "../db";

export const eventInsertSchema = createInsertSchema(dbSchema.events)
  .omit({
    id: true, // Prevent manual ID setting
    createdAt: true, // System-managed
    createdBy: true, // System-managed (set in controller)
    updatedAt: true, // System-managed
    updatedBy: true, // System-managed
  })
  .extend({
    name: z.string().min(3, "Name must be at least 3 characters"),
    location: z.string().min(3, "Location must be at least 3 characters"),
    // Intentionally no additional date validation here to allow historical events (e.g., during migration)
  });

export const eventSelectSchema = createSelectSchema(dbSchema.events);

export const eventUpdateSchema = createUpdateSchema(dbSchema.events)
  .omit({
    id: true,
    createdAt: true,
    createdBy: true,
    updatedAt: true,
    updatedBy: true,
  })
  .strict();
