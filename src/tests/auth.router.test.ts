import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { randomUUID } from "crypto";
import { db, dbSchema } from "../db";
import type {
  AuthLoginPostResponse,
  AuthRegisterPostResponse,
} from "../types/auth";
import type { ErrorResponse } from "../types/error";
import type { Member } from "../types/member";
import {
  createTestMember,
  createTestUser,
  loginTestUser,
  seedTestMember,
} from "../utils/test";

let member: Member;
let token: string;

beforeEach(async () => {
  member = await seedTestMember();
  await createTestUser({ email: "admin@email.com" }, member.vinculationCode);
  const response = await loginTestUser("admin@email.com", "password");
  if ("token" in response.data) {
    token = response.data.token;
  } else {
    throw new Error(
      "Failed to login test user: " + JSON.stringify(response.data),
    );
  }
});

afterEach(async () => {
  await db.delete(dbSchema.users);
  await db.delete(dbSchema.members);
});

describe("POST /auth/register", () => {
  describe("when request is valid", () => {
    let response: Response;
    let data: AuthRegisterPostResponse;
    beforeEach(async () => {
      const vinculationCode = randomUUID();
      await createTestMember({}, vinculationCode, token);
      const result = await createTestUser({}, vinculationCode);
      response = result.response;
      data = result.data as AuthRegisterPostResponse;
    });

    it("should respond with 201 Created", () => {
      expect(response.status).toBe(201);
    });

    it("should return a confirmation message and the user id", () => {
      expect(data).toHaveProperty("id");
      expect(data.message).toBe("User created");
    });
  });

  describe("when email is invalid", () => {
    let response: Response;
    let data: ErrorResponse;
    beforeEach(async () => {
      const result = await createTestUser(
        { email: "invalid-email" },
        member.vinculationCode,
      );
      response = result.response;
      data = result.data as ErrorResponse;
    });

    it("should respond with 400 Bad Request", () => {
      expect(response.status).toBe(400);
    });

    it("should return an error message", () => {
      expect(data.error.message).toBe("Validation failed");
      expect(data.error.details?.email).toContain("Invalid email address");
    });
  });

  describe("when password does not meet the criteria", () => {
    let response: Response;
    let data: ErrorResponse;
    beforeEach(async () => {
      const result = await createTestUser(
        { password: "1234" },
        member.vinculationCode,
      );
      response = result.response;
      data = result.data as ErrorResponse;
    });

    it("should respond with 400 Bad Request", () => {
      expect(response.status).toBe(400);
    });

    it("should return an error message", () => {
      expect(data.error.message).toBe("Validation failed");
      expect(data.error.details?.password).toContain(
        "Password must be at least 8 characters",
      );
    });
  });

  describe("when vinculation code is invalid", () => {
    let response: Response;
    let data: ErrorResponse;
    beforeEach(async () => {
      const result = await createTestUser({}, "invalid-vinculation-code");
      response = result.response;
      data = result.data as ErrorResponse;
    });

    it("should respond with 400 Bad Request", () => {
      expect(response.status).toBe(400);
    });

    it("should return an error message", () => {
      expect(data.error.message).toBe("Validation failed");
    });
  });

  describe("when vinculation code does not exists", () => {
    let response: Response;
    let data: ErrorResponse;
    beforeEach(async () => {
      const result = await createTestUser({}, randomUUID());
      response = result.response;
      data = result.data as ErrorResponse;
    });

    it("should respond with 404 Not Found", () => {
      expect(response.status).toBe(404);
    });

    it("should return an error message", () => {
      expect(data.error.message).toBe("Vinculation code does not exist");
    });
  });

  describe("when the email is already registered", () => {
    let response: Response;
    let data: ErrorResponse;

    beforeEach(async () => {
      const vinculationCode = randomUUID();
      await createTestMember({}, vinculationCode, token);
      await createTestUser({}, vinculationCode);

      const result = await createTestUser(
        { email: "user@email.com" },
        vinculationCode,
      );
      response = result.response;
      data = result.data as ErrorResponse;
    });

    it("should respond with 409 Conflict", () => {
      expect(response.status).toBe(409);
    });

    it("should return an error message", () => {
      // Member is already linked, so this error comes before email check
      expect(data.error.message).toBe("Member is already linked to a user");
    });
  });
});

describe("POST /auth/login", () => {
  describe("when credentials are valid", () => {
    let response: Response;
    let data: AuthLoginPostResponse;

    beforeEach(async () => {
      const vinculationCode = randomUUID();
      await createTestMember({}, vinculationCode, token);
      await createTestUser({}, vinculationCode);

      const result = await loginTestUser("user@email.com", "password");
      response = result.response;
      data = result.data as AuthLoginPostResponse;
    });

    it("should respond with 200 OK", () => {
      expect(response.status).toBe(200);
    });

    it("should return a JWT token", () => {
      expect(data).toHaveProperty("token");
      expect(data?.token).toBeTypeOf("string");
    });

    it("should return the user info", () => {
      expect(data).toHaveProperty("user");
      expect(data.user).toMatchObject({
        email: "user@email.com",
        role: expect.any(String),
        id: expect.any(String),
      });
    });
  });
  describe("when email does not exist", () => {
    let response: Response;
    let data: ErrorResponse;

    beforeEach(async () => {
      const result = await loginTestUser("nouser@email.com", "password");
      response = result.response;
      data = result.data as ErrorResponse;
    });

    it("should respond with 401 Unauthorized", () => {
      expect(response.status).toBe(401);
    });

    it("should return an error message", () => {
      expect(data.error.message).toBe("Invalid credentials");
    });
  });

  describe("when password is incorrect", () => {
    let response: Response;
    let data: ErrorResponse;

    beforeEach(async () => {
      await createTestUser({}, member.vinculationCode);

      const result = await loginTestUser("user@email.com", "wrongpassword");
      response = result.response;
      data = result.data as ErrorResponse;
    });

    it("should respond with 401 Unauthorized", () => {
      expect(response.status).toBe(401);
    });

    it("should return an error message", () => {
      expect(data.error.message).toBe("Invalid credentials");
    });
  });

  describe("when email is invalid format", () => {
    let response: Response;
    let data: ErrorResponse;

    beforeEach(async () => {
      const result = await loginTestUser("notanemail", "password");
      response = result.response;
      data = result.data as ErrorResponse;
    });

    it("should respond with 400 Bad Request", () => {
      expect(response.status).toBe(400);
    });

    it("should return a validation error message", () => {
      expect(data.error.message).toBe("Validation failed");
      expect(data.error.details?.email).toContain("Invalid email address");
    });
  });

  describe("when email is missing", () => {
    let response: Response;
    let data: ErrorResponse;

    beforeEach(async () => {
      const result = await loginTestUser(undefined, "password");
      response = result.response;
      data = result.data as ErrorResponse;
    });

    it("should respond with 400 Bad Request", () => {
      expect(response.status).toBe(400);
    });

    it("should return a validation error message", () => {
      expect(data.error.message).toBe("Validation failed");
      expect(data.error.details?.email).toContain(
        "Invalid input: expected string, received undefined",
      );
    });
  });
  describe("when password is missing", () => {
    let response: Response;
    let data: ErrorResponse;

    beforeEach(async () => {
      const result = await loginTestUser("user@email.com", undefined);
      response = result.response;
      data = result.data as ErrorResponse;
    });

    it("should respond with 400 Bad Request", () => {
      expect(response.status).toBe(400);
    });

    it("should return a validation error message", () => {
      expect(data.error.message).toBe("Validation failed");
      expect(data.error.details?.password).toContain(
        "Invalid input: expected string, received undefined",
      );
    });
  });

  describe("when password does not meet the criteria", () => {
    let response: Response;
    let data: ErrorResponse;

    beforeEach(async () => {
      const result = await loginTestUser("user@email.com", "1234");
      response = result.response;
      data = result.data as ErrorResponse;
    });

    it("should respond with 400 Bad Request", () => {
      expect(response.status).toBe(400);
    });

    it("should return a validation error message", () => {
      expect(data.error.message).toBe("Validation failed");
      expect(data.error.details?.password).toContain(
        "Password must be at least 8 characters",
      );
    });
  });
});
