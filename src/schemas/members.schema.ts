import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { dbSchema } from "../db";

export const memberInsertSchema = createInsertSchema(dbSchema.members, {
  fullName: (schema) => schema.nonempty("Full name cannot be empty"),
  nickname: (schema) => schema.nonempty("Nickname cannot be empty"),
  birthDate: (schema) => schema.nonempty("Birth date cannot be empty"),
});

export const memberUpdateSchema = createUpdateSchema(dbSchema.members)
  .omit({
    id: true,
    vinculationCode: true,
    createdAt: true,
    updatedAt: true,
  })
  .strict();
