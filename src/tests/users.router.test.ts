import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import app from "../app";
import { db, dbSchema } from "../db";
import type { AuthLoginPostResponse } from "../types/auth";
import type { ErrorResponse } from "../types/error";
import type {
  UserPublic,
  UsersGetResponse,
  UserUpdateResponse,
} from "../types/user";
import { createTestUser, loginTestUser, seedTestMember } from "../utils/test";

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

describe("GET /users/me", () => {
  describe("when user is authenticated", () => {
    let response: Response;
    let data: UserPublic;

    beforeEach(async () => {
      response = await app.request("/users/me", {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      data = (await response.json()) as UserPublic;
    });

    it("should respond with 200 OK", () => {
      expect(response.status).toBe(200);
    });

    it("should return the current user without sensitive fields", () => {
      expect(data).toHaveProperty("id");
      expect(data).toHaveProperty("email", "user@email.com");
      expect(data).toHaveProperty("role");
      expect(data).not.toHaveProperty("passwordHash");
      expect(data).not.toHaveProperty("providerId");
    });
  });

  describe("when user is not authenticated", () => {
    let response: Response;
    let data: ErrorResponse;

    beforeEach(async () => {
      response = await app.request("/users/me");
      data = (await response.json()) as ErrorResponse;
    });

    it("should respond with 401 Unauthorized", () => {
      expect(response.status).toBe(401);
    });
  });
});

describe("GET /users", () => {
  describe("when there is at least one user", () => {
    let response: Response;
    let data: UsersGetResponse;

    beforeEach(async () => {
      response = await app.request("/users", {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      data = (await response.json()) as UsersGetResponse;
    });

    it("should respond with 200 OK", () => {
      expect(response.status).toBe(200);
    });

    it("should return an array of users without sensitive fields", () => {
      expect(data.users).toBeArray();
      expect(data.count).toBe(1);
      expect(data.users[0]).not.toHaveProperty("passwordHash");
      expect(data.users[0]).not.toHaveProperty("providerId");
    });
  });
});

describe("GET /users/:id", () => {
  describe("when the user exists", () => {
    let response: Response;
    let data: UserPublic;

    beforeEach(async () => {
      response = await app.request(`/users/${user.user.id}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      data = (await response.json()) as UserPublic;
    });

    it("should respond with 200 OK", () => {
      expect(response.status).toBe(200);
    });

    it("should return the user without sensitive fields", () => {
      expect(data.id).toBe(user.user.id);
      expect(data).not.toHaveProperty("passwordHash");
      expect(data).not.toHaveProperty("providerId");
    });
  });

  describe("when the user does not exist", () => {
    let response: Response;
    let data: ErrorResponse;
    const fakeId = "38bd666b-cf64-41d8-8d79-ffffffffffff";

    beforeEach(async () => {
      response = await app.request(`/users/${fakeId}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      data = (await response.json()) as ErrorResponse;
    });

    it("should respond with 404 Not Found", () => {
      expect(response.status).toBe(404);
      expect(data.error.message).toBe("User not found");
    });
  });
});

describe("PATCH /users/:id", () => {
  describe("when the user exists and request is valid", () => {
    let response: Response;
    let data: UserUpdateResponse;

    beforeEach(async () => {
      response = await app.request(`/users/${user.user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ role: "admin" }),
      });
      data = (await response.json()) as UserUpdateResponse;
    });

    it("should respond with 200 OK", () => {
      expect(response.status).toBe(200);
    });

    it("should update and return the user", () => {
      expect(data.id).toBe(user.user.id);
      expect(data.message).toBe("User updated");
    });
  });

  describe("when the user does not exist", () => {
    let response: Response;
    let data: ErrorResponse;
    const fakeId = "38bd666b-cf64-41d8-8d79-ffffffffffff";

    beforeEach(async () => {
      response = await app.request(`/users/${fakeId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ role: "admin" }),
      });
      data = (await response.json()) as ErrorResponse;
    });

    it("should respond with 404 Not Found", () => {
      expect(response.status).toBe(404);
      expect(data.error.message).toBe("User not found");
    });
  });

  describe("when the request body is invalid", () => {
    let response: Response;
    let data: ErrorResponse;

    beforeEach(async () => {
      response = await app.request(`/users/${user.user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ role: "invalid_role" }),
      });
      data = (await response.json()) as ErrorResponse;
    });

    it("should respond with 400 Bad Request", () => {
      expect(response.status).toBe(400);
      expect(data.error.message).toBe("Validation failed");
    });
  });
});
