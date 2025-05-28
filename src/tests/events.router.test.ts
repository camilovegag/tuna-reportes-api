import { describe, it, expect, beforeEach } from "bun:test";
import app from "../app";
import { db, dbSchema } from "../db";

const mockRequest = {
  name: "Festival 26 años",
  date: "2025-05-28T13:05:00.000Z",
  location: "Universidad de La Sabana",
  type: "festival",
};

beforeEach(async () => {
  await db.delete(dbSchema.events);
});

function testMissingField(
  field: keyof typeof mockRequest,
  expectedError: object,
) {
  describe(`when the request is missing the ${field} field`, () => {
    let response: Response;
    let data: any;

    beforeEach(async () => {
      const { [field]: _, ...invalidRequest } = mockRequest;
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
      expect(data).toEqual({ error: expectedError });
    });
  });
}

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

    it("should return a confirmation message and the event id", () => {
      expect(data).toHaveProperty("id");
      expect(typeof data.id).toBe("string");
      expect(data.message).toBe("Event created");
    });
  });

  testMissingField("name", {
    name: ["Invalid input: expected string, received undefined"],
  });
  testMissingField("date", {
    date: ["Invalid input: expected string, received undefined"],
  });
  testMissingField("location", {
    location: ["Invalid input: expected string, received undefined"],
  });
  testMissingField("type", {
    type: [
      'Invalid option: expected one of "serenata"|"ensayo"|"festival"|"certamen"|"remate"|"parche"|"viaje"',
    ],
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

describe("GET /events", () => {
  describe("when there are no events", () => {});
  describe("when the request is successfull", () => {
    let response: Response;
    let data: any;

    beforeEach(async () => {
      await app.request("/events", {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify(mockRequest),
      });

      response = await app.request("/events");
      data = await response.json();
    });

    it("should respond with a 200 OK", () => {
      expect(response.status).toBe(200);
    });

    it("should match the response", () => {
      expect(data.events).toBeArray();
      expect(data.count).toBe(1);

      const event = data.events.at(0);
      expect(event).toHaveProperty("id");
      expect(event.status).toBe("por_confirmar");
      expect(event.isInternational).toBeFalse();
    });
  });
});
