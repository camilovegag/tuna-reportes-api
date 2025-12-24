import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { clients } from "../db/schema";

export const clientSelectSchema = createSelectSchema(clients);

export const clientInsertSchema = createInsertSchema(clients, {
  email: z.string().email().optional() as any,
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const clientUpdateSchema = clientInsertSchema.partial();

export const clientIdSchema = z.object({
  id: z.string().uuid(),
});
