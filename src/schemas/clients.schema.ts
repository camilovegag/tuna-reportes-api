import { createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { clients } from "../db/schema";

export const clientSelectSchema = createSelectSchema(clients);

export const clientInsertSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required").max(20),
  email: z.email().optional(),
  notes: z.string().optional().nullable(),
});

export const clientUpdateSchema = clientInsertSchema.partial();

export const clientIdSchema = z.object({
  id: z.uuid(),
});
