import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { clients } from "../db/schema";

export const clientSelectSchema = createSelectSchema(clients);

export const clientInsertSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(1, "Phone is required").max(20),
  email: z.union([z.string().email(), z.literal(""), z.null()]).optional(),
  notes: z.string().optional().nullable(),
});

export const clientUpdateSchema = clientInsertSchema.partial();

export const clientIdSchema = z.object({
  id: z.string().uuid(),
});
