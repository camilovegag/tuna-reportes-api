import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { randomUUID } from "crypto";
import app from "../app";
import { db, dbSchema } from "../db";
import type { AuthLoginPostResponse } from "../types/auth";
import type { ErrorResponse } from "../types/error";
import type {
  Member,
  MemberDeleteResponse,
  MemberPatchResponse,
  MemberPostResponse,
  MembersGetResponse,
} from "../types/member";
import {
  createTestMember,
  createTestUser,
  loginTestUser,
  seedTestMember,
} from "../utils/test";

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
    let data: Member;
    let memberId: string;
    beforeEach(async () => {
      const vinculationCode = randomUUID();
      const { data: member } = await createTestMember(
        {},
        vinculationCode,
        user.token,
      );
      memberId = member.id;

      response = await app.request(`/members/${memberId}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      data = (await response.json()) as Member;
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

describe("PATCH /members/:id", () => {
  describe("when the member exists and the request is valid", () => {
    let response: Response;
    let data: MemberPatchResponse;
    let memberId: string;

    beforeEach(async () => {
      const vinculationCode = randomUUID();
      const { data: member } = await createTestMember(
        {},
        vinculationCode,
        user.token,
      );
      memberId = member.id;

      response = await app.request(`/members/${memberId}`, {
        method: "PATCH",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ nickname: "updatednick" }),
      });
      data = (await response.json()) as MemberPatchResponse;
    });

    it("should respond with 200 OK", () => {
      expect(response.status).toBe(200);
    });

    it("should update and return the member", () => {
      expect(data.id).toBe(memberId);
      expect(data.message).toBe("Member updated");
    });
  });

  describe("when the member does not exist", () => {
    let response: Response;
    let data: ErrorResponse;
    const fakeId = "38bd666b-cf64-41d8-8d79-ffffffffffff";

    beforeEach(async () => {
      response = await app.request(`/members/${fakeId}`, {
        method: "PATCH",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ nickname: "updatednick" }),
      });
      data = (await response.json()) as ErrorResponse;
    });

    it("should respond with 404 Not Found", () => {
      expect(response.status).toBe(404);
      expect(data.error.message).toBe("Member not found");
    });
  });

  describe("when the request body is invalid", () => {
    let response: Response;
    let data: ErrorResponse;
    let memberId: string;

    beforeEach(async () => {
      const vinculationCode = randomUUID();
      const { data: member } = await createTestMember(
        {},
        vinculationCode,
        user.token,
      );
      memberId = member.id;

      response = await app.request(`/members/${memberId}`, {
        method: "PATCH",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ nickname: null }),
      });
      data = (await response.json()) as ErrorResponse;
    });

    it("should respond with 400 Bad Request", () => {
      expect(response.status).toBe(400);
      expect(data.error.message).toBe("Validation failed");
      expect(data.error.details?.nickname).toBeDefined();
    });
  });
});

describe("DELETE /members/:id", () => {
  describe("when the member exists", () => {
    let response: Response;
    let data: MemberDeleteResponse;
    let memberId: string;
    let deletedMember: Member;

    beforeEach(async () => {
      const vinculationCode = randomUUID();
      const { data: member } = await createTestMember(
        {},
        vinculationCode,
        user.token,
      );
      memberId = member.id;

      response = await app.request(`/members/${memberId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      data = (await response.json()) as MemberDeleteResponse;

      const deletedMemberResponse = await app.request(`/members/${memberId}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      const deletedMemberData = (await deletedMemberResponse.json()) as Member;
      deletedMember = deletedMemberData;
    });

    it("should respond with 200 OK", () => {
      expect(response.status).toBe(200);
    });

    it("should return the member id and a message", () => {
      expect(data).toHaveProperty("id", memberId);
      expect(data).toHaveProperty("message", "Member deactivated");
    });

    it("should set isActive to false in the database", async () => {
      expect(deletedMember.isActive).toBe(false);
    });
  });

  describe("when the member does not exist", () => {
    let response: Response;
    let data: ErrorResponse;
    const fakeId = "38bd666b-cf64-41d8-8d79-ffffffffffff";

    beforeEach(async () => {
      response = await app.request(`/members/${fakeId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      data = (await response.json()) as ErrorResponse;
    });

    it("should respond with 404 Not Found", () => {
      expect(response.status).toBe(404);
      expect(data.error.message).toBe("Member not found");
    });
  });
});
