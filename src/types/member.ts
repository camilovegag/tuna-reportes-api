import type { dbSchema } from "../db";

export type Member = typeof dbSchema.members.$inferSelect;

export type MemberInsert = typeof dbSchema.members.$inferInsert;

export type MembersGetResponse = {
  members: Member[];
  count: number;
};

export type MemberPostResponse = {
  id: string;
  message: string;
};

export type MemberPatchResponse = {
  id: string;
  message: string;
};

export type MemberDeleteResponse = {
  id: string;
  message: string;
};
