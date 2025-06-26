import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import app from "../app";
import { db, dbSchema } from "../db";
import type { LoginInput, RegisterInput } from "../schemas/auth.schema";
import type {
  AuthLoginPostResponse,
  AuthRegisterPostResponse,
} from "../types/auth";
import type { ErrorResponse } from "../types/error";

const mockRequest: RegisterInput = {
  email: "user@email.com",
  password: "password",
  vinculationCode: "5121caa3-3682-4381-8b97-2ccba11af93b",
};

beforeEach(async () => {
  await db.insert(dbSchema.members).values({
    rank: "tuno",
    birthDate: "2000-01-01",
    nickname: "testnick",
    fullName: "Test User",
    vinculationCode: mockRequest.vinculationCode,
  });

  console.log(
    "inserted user with vinculationCode:",
    mockRequest.vinculationCode,
  );
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
      response = await app.request("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mockRequest),
      });
      data = (await response.json()) as AuthRegisterPostResponse;
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
      const badRequest = { ...mockRequest, email: "invalid-email" };
      response = await app.request("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(badRequest),
      });
      data = (await response.json()) as ErrorResponse;
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
      const badRequest = { ...mockRequest, password: "1234" };
      response = await app.request("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(badRequest),
      });
      data = (await response.json()) as ErrorResponse;
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
      const badRequest = {
        ...mockRequest,
        vinculationCode: "invalid-vinculation-code",
      };
      response = await app.request("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(badRequest),
      });
      data = (await response.json()) as ErrorResponse;
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
      const badRequest = {
        ...mockRequest,
        vinculationCode: "a6c56b4c-5234-4fbb-bf87-dacef19e89b2",
      };
      response = await app.request("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(badRequest),
      });
      data = (await response.json()) as ErrorResponse;
    });

    it("should respond with 400 Bad Request", () => {
      expect(response.status).toBe(400);
    });

    it("should return an error message", () => {
      expect(data.error.message).toBe("Vinculation code does not exists");
    });
  });

  describe("when the email is already registered", () => {
    let response: Response;
    let data: ErrorResponse;

    beforeEach(async () => {
      await db.insert(dbSchema.members).values({
        rank: "tuno",
        birthDate: "2000-01-01",
        nickname: "testnick2",
        fullName: "Test User 2",
        vinculationCode: "dc7994bd-77fa-479b-88a7-bcafc4ed6f26",
      });

      await app.request("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mockRequest),
      });

      response = await app.request("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...mockRequest,
          vinculationCode: "dc7994bd-77fa-479b-88a7-bcafc4ed6f26",
        }),
      });

      data = (await response.json()) as ErrorResponse;
    });

    it("should respond with 400 Bad Request", () => {
      expect(response.status).toBe(400);
    });

    it("should return an error message", () => {
      expect(data.error.message).toBe("Email is already registered");
    });
  });
});
