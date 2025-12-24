import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { dbSchema } from "../db";

export const attendanceInsertSchema = createInsertSchema(
  dbSchema.attendances,
).omit({
  id: true,
  updatedAt: true,
});

export const attendanceSelectSchema = createSelectSchema(dbSchema.attendances);

export const attendanceUpdateSchema = createUpdateSchema(dbSchema.attendances)
  .pick({
    status: true,
  })
  .strict();
