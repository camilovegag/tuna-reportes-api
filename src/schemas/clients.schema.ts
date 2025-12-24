import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { clients } from "../db/schema";

export const clientSelectSchema = createSelectSchema(clients);

export const clientInsertSchema = z.object({
  name: z.string(),
  phone: z.string().max(20),
  email: z
    .union([z.string().email(), z.literal("")])
    .optional()
    .nullable(),
  notes: z.string().optional().nullable(),
});

export const clientUpdateSchema = clientInsertSchema.partial();

export const clientIdSchema = z.object({
  id: z.string().uuid(),
});
