import { relations } from "drizzle-orm/relations";
import { attendances, events, members, users } from "./schema";

export const usersRelations = relations(users, ({ one, many }) => ({
  member: one(members, {
    fields: [users.memberId],
    references: [members.id],
  }),
  attendances: many(attendances),
  events_createdBy: many(events, {
    relationName: "events_createdBy_users_id",
  }),
  events_updatedBy: many(events, {
    relationName: "events_updatedBy_users_id",
  }),
}));

export const membersRelations = relations(members, ({ many }) => ({
  users: many(users),
  attendances: many(attendances),
}));

export const attendancesRelations = relations(attendances, ({ one }) => ({
  event: one(events, {
    fields: [attendances.eventId],
    references: [events.id],
  }),
  member: one(members, {
    fields: [attendances.memberId],
    references: [members.id],
  }),
  user: one(users, {
    fields: [attendances.updatedBy],
    references: [users.id],
  }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  attendances: many(attendances),
  user_createdBy: one(users, {
    fields: [events.createdBy],
    references: [users.id],
    relationName: "events_createdBy_users_id",
  }),
  user_updatedBy: one(users, {
    fields: [events.updatedBy],
    references: [users.id],
    relationName: "events_updatedBy_users_id",
  }),
}));
