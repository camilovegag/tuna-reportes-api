import { describe, it, expect, beforeEach } from "bun:test";
import { mockAuth } from "../middleware/mock-auth";
import app from "../app";

const mockRequest = {
  name: "Festival #26 Tuna Sabana",
  date: "2025-04-07T13:05:00.000Z",
  location: "Universidad de La Sabana",
  type: "festival",
  is_international: false,
  status: "confirmado",
};

describe("POST /events", () => {
  describe("when the request is valid", () => {
    let response: Response;
    let data: any;

    beforeEach(async () => {
      response = await app.request("/events", {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body: JSON.stringify(mockRequest),
      });

      data = await response.json();
    });

    it("should respond with 201 Created", () => {
      expect(response.status).toBe(201);
    });

    it("should return a confirmation message containing the event id", () => {
      expect(data).toEqual({ id: "some-uuid", message: "created" });
    });
  });

  describe("when the request is missing the name field", () => {
    let response: Response;
    let data: any;

    beforeEach(async () => {
      const invalidRequest = { ...mockRequest, name: "" };
      response = await app.request("/events", {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify(invalidRequest),
      });

      data = await response.json();
    });

    it("should respond with 400 Bad Request", () => {
      expect(response.status).toBe(400);
    });

    it("should return an error message", () => {
      expect(data).toEqual({ error: { name: ["name is required"] } });
    });
  });

  // it('should validate missing fields and reject the creation, saying which one is missing', () => {})
  // it('should return 400 if type or status are not part of the allowed enum values', () => {})
  // it('should validate that the enums for type and status are correct', () => {})
  // it('should validate that date is not in the past', () => {})
  // it('should validate the minimum lengths for name and location', () => {})
  // it('should return 400 if name or location are only spaces or empty strings', () => {})

  // it('should create events only if the user is authenticated', () => {})
  // it('should create events only if the user has an editor or admin role', () => {})
  // it('should ignore tampering with created_at, created_by, updated_at or updated_by as these are set by the DB', () => {})
  // it('should not allow setting the id manually in the request body', () => {})

  // it('should only allow one event with the same name and date (no duplicates)', () => {})
  // it('should handle the is_international boolean, it will be false by default if not sent', () => {})
});
