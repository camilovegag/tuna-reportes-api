import { dbSchema } from "../db";

// Extract role values directly from the schema enum (single source of truth)
export const USER_ROLES = dbSchema.userRole.enumValues; // ["admin", "editor", "viewer"]

// Explicitly map named roles without relying on enum ordering
export const ROLES = {
  ADMIN: USER_ROLES[USER_ROLES.indexOf("admin")] as UserRole,
  EDITOR: USER_ROLES[USER_ROLES.indexOf("editor")] as UserRole,
  VIEWER: USER_ROLES[USER_ROLES.indexOf("viewer")] as UserRole,
} as const;

// Type inferred from the enum
export type UserRole = (typeof USER_ROLES)[number]; // "admin" | "editor" | "viewer"
