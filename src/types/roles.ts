import { dbSchema } from "../db";

// Extract role values directly from the schema enum (single source of truth)
export const USER_ROLES = dbSchema.userRole.enumValues; // ["admin", "editor", "viewer"]

// Explicitly map named roles - directly use the string values for type safety
export const ROLES = {
  ADMIN: "admin",
  EDITOR: "editor",
  VIEWER: "viewer",
} as const;

// Type inferred from the enum
export type UserRole = (typeof USER_ROLES)[number]; // "admin" | "editor" | "viewer"
