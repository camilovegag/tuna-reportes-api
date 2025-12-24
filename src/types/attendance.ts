import { dbSchema } from "../db";

export type Attendance = typeof dbSchema.attendances.$inferSelect;
export type AttendanceInsert = typeof dbSchema.attendances.$inferInsert;

export type AttendancesGetResponse = {
  attendances: Attendance[];
  count: number;
};

export type AttendancePostResponse = {
  id: string;
  message: string;
};

export type AttendanceUpdateResponse = {
  id: string;
  message: string;
};

export type AttendanceDeleteResponse = {
  id: string;
  message: string;
};
