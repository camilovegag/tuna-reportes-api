import app from "../app";
import { db, dbSchema } from "../db";
import { eq } from "drizzle-orm";
import type {
  AuthLoginPostResponse,
  AuthRegisterPostResponse,
} from "../types/auth";
import type { MemberInsert, MemberPostResponse } from "../types/member";
import type { EventPostResponse } from "../types/event";
import type { ErrorResponse } from "../types/error";

export async function seedTestMember() {
  const defaultMember: MemberInsert = {
    rank: "tuno",
    birthDate: "2000-01-01",
    nickname: "testnick",
    fullName: "Test User",
  };
  const [member] = await db
    .insert(dbSchema.members)
    .values(defaultMember)
    .returning();

  if (!member) throw new Error("Failed to create test member");

  return member;
}

export async function createTestMember(
  memberData = {},
  vinculationCode: string,
  token: string,
) {
  const defaultMember: MemberInsert = {
    rank: "tuno",
    birthDate: "2000-01-01",
    nickname: "new",
    fullName: "New User",
    vinculationCode,
    ...memberData,
  };
  const response = await app.request("/members", {
    method: "POST",
    headers: {
      "Content-type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(defaultMember),
  });
  const data = (await response.json()) as MemberPostResponse;

  return { response, data };
}

export async function createTestUser(
  userData = {},
  vinculationCode: string,
  role: "admin" | "editor" | "viewer" = "admin", // Default to admin for tests
) {
  const defaultUser = {
    email: "user@email.com",
    password: "password",
    ...userData,
    vinculationCode,
  };
  const response = await app.request("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(defaultUser),
  });
  const data = (await response.json()) as
    | AuthRegisterPostResponse
    | ErrorResponse;

  // Throw error if registration failed
  if (!("id" in data)) {
    throw new Error("Registration failed: " + JSON.stringify(data));
  }

  // Update role after registration since register endpoint doesn't accept role
  await db
    .update(dbSchema.users)
    .set({ role })
    .where(eq(dbSchema.users.id, data.id));

  return { response, data, user: defaultUser };
}

export async function loginTestUser(
  email: string | undefined,
  password: string | undefined,
) {
  const response = await app.request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = (await response.json()) as AuthLoginPostResponse | ErrorResponse;

  return { response, data };
}

export const defaultEventData = {
  name: "Festival 26 años",
  date: "2025-05-28T13:05:00.000Z",
  location: "Universidad de La Sabana",
  type: "festival",
};

export async function createTestEvent(eventData = {}, token: string) {
  const response = await app.request("/events", {
    method: "POST",
    headers: {
      "Content-type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ...defaultEventData, ...eventData }),
  });
  const data = (await response.json()) as EventPostResponse;
  return { response, data };
}
