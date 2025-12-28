import { dbSchema } from "../db";

// Extract role values directly from the schema enum (single source of truth)
export const USER_ROLES = dbSchema.userRole.enumValues; // ["admin", "editor", "viewer"]

// Destructure for named access while maintaining schema as source of truth
const [ADMIN, EDITOR, VIEWER] = USER_ROLES;
export const ROLES = { ADMIN, EDITOR, VIEWER } as const;

// Type inferred from the enum
export type UserRole = (typeof USER_ROLES)[number]; // "admin" | "editor" | "viewer"
