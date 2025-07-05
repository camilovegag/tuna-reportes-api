import {
  pgTable,
  foreignKey,
  uuid,
  text,
  timestamp,
  unique,
  integer,
  date,
  varchar,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const attendanceStatus = pgEnum("attendance_status", [
  "asiste",
  "no_asiste",
  "por_confirmar",
  "no_responde",
]);
export const bloodType = pgEnum("blood_type", [
  "a+",
  "a-",
  "b+",
  "b-",
  "ab+",
  "ab-",
  "o+",
  "o-",
]);
export const civilStatus = pgEnum("civil_status", [
  "soltero",
  "casado",
  "divorciado",
]);
export const epsProvider = pgEnum("eps_provider", [
  "aliansalud",
  "colmedica",
  "compensar",
  "sanitas",
  "sura",
  "salud_total",
  "colpatria",
  "coomeva",
  "famisanar",
  "medifiatc",
  "cafesalud",
  "susalud",
  "asmetsalud",
  "nueva_eps",
  "sanidad_militar",
  "sisben",
]);
export const eventStatus = pgEnum("event_status", [
  "por_confirmar",
  "confirmado",
  "realizado",
  "cancelado",
]);
export const eventType = pgEnum("event_type", [
  "serenata",
  "ensayo",
  "festival",
  "certamen",
  "remate",
  "parche",
  "viaje",
]);
export const memberRank = pgEnum("member_rank", ["aspirante", "bulto", "tuno"]);
export const userRole = pgEnum("user_role", ["admin", "editor", "viewer"]);
export const authProvider = pgEnum("auth_provider", [
  "local",
  "google",
  "clerk",
]);

export const users = pgTable(
  "users",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: text("password_hash"),
    provider: authProvider().default("local"),
    providerId: text("provider_id"),
    memberId: uuid("member_id"),
    role: userRole().default("viewer").notNull(),
    lastLoginAt: timestamp("last_login_at", {
      withTimezone: true,
      mode: "string",
    }),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    unique("users_member_id_unique").on(table.memberId),
    foreignKey({
      columns: [table.memberId],
      foreignColumns: [members.id],
      name: "users_member_id_fkey1",
    }),
  ],
);

export const members = pgTable(
  "members",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    raul: integer(),
    rank: memberRank().notNull(),
    birthDate: date("birth_date").notNull(),
    nickname: varchar({ length: 100 }).notNull(),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    phone: varchar({ length: 50 }),
    address: text(),
    email: varchar({ length: 255 }),
    documentNumber: varchar("document_number", { length: 50 }),
    documentIssuedAt: varchar("document_issued_at", { length: 100 }),
    eps: epsProvider(),
    bloodType: bloodType("blood_type"),
    civilStatus: civilStatus("civil_status"),
    partnerName: varchar("partner_name", { length: 255 }),
    childrenNames: text("children_names"),
    joinedAt: date("joined_at"),
    becaDate: date("beca_date"),
    deceasedAt: date("deceased_at"),
    imageUrl: text("image_url"),
    vinculationCode: uuid("vinculation_code").defaultRandom().notNull(),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [unique("members_raul_key").on(table.raul)],
);

export const attendances = pgTable(
  "attendances",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    eventId: uuid("event_id").notNull(),
    memberId: uuid("member_id").notNull(),
    status: attendanceStatus().default("por_confirmar").notNull(),
    updatedBy: uuid("updated_by"),
    updatedAt: timestamp("updated_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.eventId],
      foreignColumns: [events.id],
      name: "attendances_event_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.memberId],
      foreignColumns: [members.id],
      name: "attendances_member_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.updatedBy],
      foreignColumns: [users.id],
      name: "attendances_updated_by_fkey",
    }),
    unique("attendances_event_id_member_id_key").on(
      table.eventId,
      table.memberId,
    ),
  ],
);

export const events = pgTable(
  "events",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: text().notNull(),
    description: text(),
    date: timestamp({ withTimezone: true, mode: "string" }).notNull(),
    location: text().notNull(),
    type: eventType().notNull(),
    isInternational: boolean("is_international").default(false),
    status: eventStatus().default("por_confirmar").notNull(),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    updatedBy: uuid("updated_by"),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" }),
  },
  (table) => [
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: "events_created_by_fkey",
    }),
    foreignKey({
      columns: [table.updatedBy],
      foreignColumns: [users.id],
      name: "events_updated_by_fkey",
    }),
  ],
);
