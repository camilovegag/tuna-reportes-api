import type { InferSelectModel } from "drizzle-orm";
import { dbSchema } from "../db";

export type Event = InferSelectModel<typeof dbSchema.events>;

export type EventsGetResponse = {
  events: Event[];
  count: number;
};

export type EventPostResponse = {
  id: string;
  message: string;
};
