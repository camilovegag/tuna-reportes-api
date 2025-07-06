import { dbSchema } from "../db";

export type Member = typeof dbSchema.members.$inferSelect;

export type MemberInsert = typeof dbSchema.members.$inferInsert;
