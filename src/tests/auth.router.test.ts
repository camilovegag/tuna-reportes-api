import { beforeEach, describe, expect, it } from "bun:test";
import type { RegisterInput } from "../schemas/auth.schema";
import app from "../app";

const mockRequest: RegisterInput = {
  email: "user@email.com",
  password: "password",
  vinculationCode: "uuid",
};

describe("POST /auth/register", () => {
  let response: Response;
  let data: any;

  beforeEach(async () => {
    response = await app.request("/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mockRequest),
    });
    data = await response.json();
  });

  describe("when request is valid", () => {
    it("should respond with 201 Created", () => {
      expect(response.status).toBe(201);
    });
    it("should return a confirmation message and the user id", () => {
      expect(data).toHaveProperty("id");
      expect(data.message).toBe("User created");
    });
  });
});
