import { dbSchema } from "../db";

export type Event = typeof dbSchema.events.$inferSelect;
export type EventInsert = typeof dbSchema.events.$inferInsert;

export type EventsGetResponse = {
  events: Event[];
  count: number;
  total: number;
  limit: number;
  offset: number;
};

export type EventPostResponse = {
  id: string;
  message: string;
};
