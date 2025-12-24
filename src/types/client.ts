import { dbSchema } from "../db";

export type Client = typeof dbSchema.clients.$inferSelect;

export type ClientInsert = typeof dbSchema.clients.$inferInsert;

export type ClientsGetResponse = {
  items: Client[];
  count: number;
};
