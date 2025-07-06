import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import app from "../app";
import { ERROR_CODES } from "../constants/error-codes";
import { db, dbSchema } from "../db";
import type { ErrorResponse } from "../types/error";
import type {
  Event,
  EventPostResponse,
  EventsGetResponse,
} from "../types/event";
import {
  createTestEvent,
  createTestMember,
  createTestUser,
  defaultEventData,
  loginTestUser,
} from "../utils/test";

let token: string;

beforeEach(async () => {
  const member = await createTestMember();
  await createTestUser({}, member.vinculationCode);
  const response = await loginTestUser("user@email.com", "password");
  if ("token" in response.data) {
    token = response.data.token;
  } else {
    throw new Error(
      "Failed to login test user: " + JSON.stringify(response.data),
    );
  }
});

afterEach(async () => {
  await db.delete(dbSchema.events);
  await db.delete(dbSchema.users);
  await db.delete(dbSchema.members);
});

function testMissingField(
  field: keyof typeof defaultEventData,
  expectedError: Record<string, string[]>,
) {
  describe(`when the request is missing the ${field} field`, () => {
    let response: Response;
    let data: ErrorResponse;

    beforeEach(async () => {
      const { [field]: _, ...invalidRequest } = defaultEventData;
      response = await app.request("/events", {
        method: "POST",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(invalidRequest),
      });
      data = (await response.json()) as ErrorResponse;
    });

    it("should respond with 400 Bad Request", () => {
      expect(response.status).toBe(400);
    });

    it("should return an error message", () => {
      expect(data).toEqual({
        error: {
          message: "Validation failed",
          details: expectedError,
          code: ERROR_CODES.VALIDATION,
        },
      });
    });
  });
}

describe("POST /events", () => {
  describe("when the request is valid", () => {
    let response: Response;
    let data: EventPostResponse;

    beforeEach(async () => {
      const event = await createTestEvent({}, token);
      response = event.response;
      data = event.data;
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

  it.todo("should validate that date is not in the past");
  it.todo("should validate the minimum lengths for name and location");
  it.todo("should create events only if the user is authenticated");
  it.todo("should create events only if the user has an editor or admin role");
  it.todo("should not allow setting the id manually in the request body");
  it.todo(
    "should ignore tampering with created_at, created_by, updated_at or updated_by as these are set by the DB",
  );
  it.todo(
    "should only allow one event with the same name and date (no duplicates)",
  );
});

describe("GET /events", () => {
  describe("when there are no events", () => {
    it("should return 200 OK and an empty events array", async () => {
      const response = await app.request("/events", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await response.json()) as EventsGetResponse;

      expect(response.status).toBe(200);
      expect(data.events).toBeArray();
      expect(data.events).toBeEmpty();
      expect(data.count).toBe(0);
    });
  });

  describe("when there is at least one event", () => {
    let response: Response;
    let data: EventsGetResponse;
    let event: Event;

    beforeEach(async () => {
      await createTestEvent({}, token);
      response = await app.request("/events", {
        headers: { Authorization: `Bearer ${token}` },
      });
      data = (await response.json()) as EventsGetResponse;
      event = data.events.at(0)!;
    });

    it("should respond with a 200 OK", () => {
      expect(response.status).toBe(200);
    });

    it("should return the created event with correct fields and values", () => {
      expect(data.events).toBeArray();
      expect(data.count).toBe(1);
    });

    it("should set status to 'por_confirmar' and isInternational to false by default", () => {
      expect(event.status).toBe("por_confirmar");
      expect(event.isInternational).toBeFalse();
    });
  });
});

describe("GET /events/:id", () => {
  describe("when the event exists", () => {
    let createdEvent: Event;
    let response: Response;
    let event: Event;
    beforeEach(async () => {
      const { data } = await createTestEvent({}, token);
      const getResponse = await app.request("/events", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const getData = (await getResponse.json()) as EventsGetResponse;
      const foundEvent = getData.events.find((event) => event.id === data.id);

      if (!foundEvent) {
        throw new Error("Created event not found in events list");
      }
      createdEvent = foundEvent;

      response = await app.request(`/events/${createdEvent.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      event = (await response.json()) as Event;
    });

    it("should respond with 200 OK", () => {
      expect(response.status).toBe(200);
    });

    it("should return the expected object", () => {
      expect(event.id).toBe(createdEvent.id);
    });
  });
  describe("when the id is not an uuid", () => {
    it("should respond with 400 Bad Request", async () => {
      const response = await app.request("/events/bad-formated-id", {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(response.status).toBe(400);

      const data = (await response.json()) as ErrorResponse;
      expect(data.error.message).toBe("Invalid event id format");
    });
  });
  describe("when the event does not exist", () => {
    it("should respond with 404 Not Found", async () => {
      const response = await app.request(
        "/events/38bd666b-cf64-41d8-8d79-ffffffffffff",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      expect(response.status).toBe(404);

      const data = (await response.json()) as ErrorResponse;
      expect(data.error.message).toBe("Event not found");
    });
  });
});

describe("PATCH /events/:id", () => {
  describe("when the event exists and the request is valid", () => {
    let patchResponse: Response;
    let patchData: Event;

    beforeEach(async () => {
      const { data } = await createTestEvent({}, token);

      patchResponse = await app.request(`/events/${data.id}`, {
        method: "PATCH",
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: "Certamen 26 años",
          date: "2025-09-20T13:00:00.000Z",
        }),
      });

      patchData = (await patchResponse.json()) as Event;
    });

    it("should respond with 200 OK", () => {
      expect(patchResponse.status).toBe(200);
    });

    it("should update the event with the provided fields", () => {
      expect(patchData.name).toBe("Certamen 26 años");
      expect(new Date(patchData.date).toISOString()).toBe(
        "2025-09-20T13:00:00.000Z",
      );
    });
  });

  describe.todo("when the event does not exist", () => {
    // it("should respond with 404 Not Found and an error message");
  });

  describe.todo("when the id is not a valid uuid", () => {
    // it("should respond with 400 Bad Request and a validation error");
  });

  describe.todo("when the request body is invalid", () => {
    // it("should respond with 400 Bad Request and a validation error");
    // it("should not update any field if validation fails");
  });

  describe.todo("when trying to update protected fields", () => {
    // it("should ignore or reject updates to protected fields");
  });

  describe.todo("when no updatable fields are provided", () => {
    // it("should respond with 400 Bad Request and an error message");
  });
});
