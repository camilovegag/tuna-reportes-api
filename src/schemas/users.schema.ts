import { createSelectSchema, createUpdateSchema } from "drizzle-zod";
import { dbSchema } from "../db";

export const userSelectSchema = createSelectSchema(dbSchema.users);

export const userUpdateSchema = createUpdateSchema(dbSchema.users)
  .pick({
    role: true,
  })
  .strict();
