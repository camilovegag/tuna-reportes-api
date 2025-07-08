import { createInsertSchema } from "drizzle-zod";
import { dbSchema } from "../db";

export const memberInsertSchema = createInsertSchema(dbSchema.members, {
  fullName: (schema) => schema.nonempty("Full name cannot be empty"),
  nickname: (schema) => schema.nonempty("Nickname cannot be empty"),
  birthDate: (schema) => schema.nonempty("Birth date cannot be empty"),
});
