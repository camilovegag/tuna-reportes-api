import type { dbSchema } from "../db";

export type User = typeof dbSchema.users.$inferSelect;
export type UserInsert = typeof dbSchema.users.$inferInsert;

// Public user type (without sensitive fields)
export type UserPublic = Omit<User, "passwordHash" | "providerId">;

export type UsersGetResponse = {
  users: UserPublic[];
  count: number;
};

export type UserUpdateResponse = {
  id: string;
  message: string;
};
