import { createInsertSchema } from "drizzle-zod";
import { dbSchema } from "../db";
import { z } from "zod/v4";

export const userInsertSchema = createInsertSchema(dbSchema.users);

export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  vinculationCode: z.uuid(),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
