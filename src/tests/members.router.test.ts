import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import app from "../app";
import { db, dbSchema } from "../db";
import type { AuthLoginPostResponse } from "../types/auth";
import type {
  Member,
  MemberPostResponse,
  MembersGetResponse,
} from "../types/member";
import { seedTestMember, createTestUser, loginTestUser } from "../utils/test";
import type { ErrorResponse } from "../types/error";
import { randomUUID } from "crypto";

let user: AuthLoginPostResponse;

beforeEach(async () => {
  const member = await seedTestMember();
  await createTestUser({}, member.vinculationCode);
  const { data } = await loginTestUser("user@email.com", "password");
  user = data as AuthLoginPostResponse;
});
afterEach(async () => {
  await db.delete(dbSchema.users);
  await db.delete(dbSchema.members);
});

describe("GET /members", () => {
  describe("when there is at least one member", () => {
    let response: Response;
    let data: MembersGetResponse;

    beforeEach(async () => {
      response = await app.request("/members", {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      data = (await response.json()) as MembersGetResponse;
    });

    it("should respond with 200 OK", () => {
      expect(response.status).toBe(200);
    });

    it("should return an array of members", () => {
      expect(data.members).toBeArray();
      expect(data.count).toBe(1);
    });
  });
});

describe("GET /members/:id", () => {
  describe("when the member exist", () => {
    let response: Response;
    let data: any;
    let memberId: string;
    beforeEach(async () => {
      const member = await seedTestMember();
      memberId = member.id;

      response = await app.request(`/members/${memberId}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      data = await response.json();
    });

    it("should respond with 200 OK", () => {
      expect(response.status).toBe(200);
    });

    it("should return the expected object", () => {
      expect(data.id).toBe(memberId);
    });
  });
  describe.todo("when the id is not an uuid", () => {});
  describe.todo("when the member does not exist", () => {});
});

describe("POST /members", () => {
  describe("when the request is valid", () => {
    let response: Response;
    let data: MemberPostResponse;

    beforeEach(async () => {
      response = await app.request("/members", {
        method: "POST",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          rank: "tuno",
          birthDate: "2000-01-01",
          nickname: "new",
          fullName: "New User",
        }),
      });
      data = (await response.json()) as MemberPostResponse;
    });

    it("should respond with 201 Created", () => {
      expect(response.status).toBe(201);
    });

    it("should return a confirmation message and the member id", () => {
      expect(data).toHaveProperty("id");
      expect(typeof data.id).toBe("string");
      expect(data.message).toBe("Member created");
    });
  });
});
