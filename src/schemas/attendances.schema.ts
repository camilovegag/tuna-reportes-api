import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import type { z } from "zod/v4";
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

export type AttendanceInsert = z.infer<typeof attendanceInsertSchema>;
export type AttendanceUpdate = z.infer<typeof attendanceUpdateSchema>;
