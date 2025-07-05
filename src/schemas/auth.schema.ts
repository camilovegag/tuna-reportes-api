import { z } from "zod/v4";
import type { authProvider } from "../db/schema";

export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  vinculationCode: z.uuid(),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export type AuthProvider = (typeof authProvider.enumValues)[number];
