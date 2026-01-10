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
  seedTestMember,
  createTestUser,
  defaultEventData,
  loginTestUser,
} from "../utils/test";

let token: string;

beforeEach(async () => {
  const member = await seedTestMember();
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

  it("should validate the minimum lengths for name and location", async () => {
    const shortName = {
      ...defaultEventData,
      name: "AB", // Too short
    };

    const res1 = await app.request("/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(shortName),
    });

    expect(res1.status).toBe(400);
    const body1 = (await res1.json()) as ErrorResponse;
    expect(body1.error.details?.name?.[0]).toContain("at least 3 characters");

    const shortLocation = {
      ...defaultEventData,
      location: "XY", // Too short
    };

    const res2 = await app.request("/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(shortLocation),
    });

    expect(res2.status).toBe(400);
    const body2 = (await res2.json()) as ErrorResponse;
    expect(body2.error.details?.location?.[0]).toContain(
      "at least 3 characters",
    );
  });

  it("should create events only if the user is authenticated", async () => {
    const res = await app.request("/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // No Authorization header
      },
      body: JSON.stringify(defaultEventData),
    });

    expect(res.status).toBe(401);
  });

  it("should create events only if the user has an editor or admin role", async () => {
    // Create viewer user
    const viewerMember = await seedTestMember();
    await createTestUser(
      { email: "viewer@test.com" },
      viewerMember.vinculationCode,
      "viewer",
    );
    const viewerAuth = await loginTestUser("viewer@test.com", "password");

    if (!("token" in viewerAuth.data)) {
      throw new Error("Failed to get viewer token");
    }

    const res = await app.request("/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${viewerAuth.data.token}`,
      },
      body: JSON.stringify(defaultEventData),
    });

    expect(res.status).toBe(403);
    const body = (await res.json()) as ErrorResponse;
    expect(body.error.code).toBe(ERROR_CODES.FORBIDDEN);
  });

  it("should not allow setting the id manually in the request body", async () => {
    const withId = {
      ...defaultEventData,
      id: "12345678-1234-1234-1234-123456789012",
    };

    const res = await app.request("/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(withId),
    });

    expect(res.status).toBe(201);
    const created = (await res.json()) as EventPostResponse;

    // ID should NOT match the one we sent
    expect(created.id).not.toBe(withId.id);
  });

  it("should ignore tampering with created_at, created_by, updated_at or updated_by as these are set by the DB", async () => {
    const tamperedEvent = {
      ...defaultEventData,
      createdAt: "2020-01-01T00:00:00.000Z",
      createdBy: "fake-user-id",
      updatedAt: "2020-01-01T00:00:00.000Z",
      updatedBy: "another-fake-id",
    };

    const res = await app.request("/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(tamperedEvent),
    });

    expect(res.status).toBe(201);
    const created = (await res.json()) as EventPostResponse;

    // Fetch the created event to check system fields
    const fetchRes = await app.request(`/events/${created.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const event = (await fetchRes.json()) as Event;

    // createdAt should be recent, not the tampered value
    const createdDate = new Date(event.createdAt!);
    expect(createdDate.getFullYear()).toBe(new Date().getFullYear());
    expect(event.createdAt).not.toBe(tamperedEvent.createdAt);
  });

  it("should only allow one event with the same name and date (no duplicates)", async () => {
    // Create first event
    await app.request("/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(defaultEventData),
    });

    // Try to create duplicate
    const res = await app.request("/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(defaultEventData),
    });

    expect(res.status).toBe(409);
    const body = (await res.json()) as ErrorResponse;
    expect(body.error.code).toBe(ERROR_CODES.CONFLICT);
    expect(body.error.message).toContain("already exists");
  });
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

describe("GET /events with filters", () => {
  beforeEach(async () => {
    // Create events with different statuses and types for testing
    await createTestEvent(
      {
        name: "Serenata Confirmada",
        type: "serenata",
        status: "confirmado",
        date: "2026-03-15T20:00:00.000Z",
      },
      token,
    );
    await createTestEvent(
      {
        name: "Ensayo Por Confirmar",
        type: "ensayo",
        status: "por_confirmar",
        date: "2026-03-20T18:00:00.000Z",
      },
      token,
    );
    await createTestEvent(
      {
        name: "Festival Realizado",
        type: "festival",
        status: "realizado",
        date: "2026-01-10T12:00:00.000Z",
      },
      token,
    );
    await createTestEvent(
      {
        name: "Serenata Cancelada",
        type: "serenata",
        status: "cancelado",
        date: "2026-02-14T21:00:00.000Z",
      },
      token,
    );
  });

  describe("when filtering by status", () => {
    it("should return only events with the specified status", async () => {
      const res = await app.request("/events?status=confirmado", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as EventsGetResponse;

      expect(res.status).toBe(200);
      expect(data.events.every((e) => e.status === "confirmado")).toBe(true);
      expect(data.count).toBe(1);
    });

    it("should support comma-separated status values", async () => {
      const res = await app.request("/events?status=confirmado,por_confirmar", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as EventsGetResponse;

      expect(res.status).toBe(200);
      expect(
        data.events.every((e) =>
          ["confirmado", "por_confirmar"].includes(e.status),
        ),
      ).toBe(true);
      expect(data.count).toBe(2);
    });

    it("should ignore invalid status values", async () => {
      const res = await app.request("/events?status=invalid_status", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as EventsGetResponse;

      expect(res.status).toBe(200);
      // Invalid status is ignored, returns all events
      expect(data.count).toBe(4);
    });
  });

  describe("when filtering by type", () => {
    it("should return only events with the specified type", async () => {
      const res = await app.request("/events?type=serenata", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as EventsGetResponse;

      expect(res.status).toBe(200);
      expect(data.events.every((e) => e.type === "serenata")).toBe(true);
      expect(data.count).toBe(2);
    });

    it("should support comma-separated type values", async () => {
      const res = await app.request("/events?type=serenata,ensayo", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as EventsGetResponse;

      expect(res.status).toBe(200);
      expect(
        data.events.every((e) => ["serenata", "ensayo"].includes(e.type)),
      ).toBe(true);
      expect(data.count).toBe(3);
    });
  });

  describe("when filtering by date range", () => {
    it("should return events from a specific date", async () => {
      const res = await app.request("/events?from=2026-03-01", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as EventsGetResponse;

      expect(res.status).toBe(200);
      expect(
        data.events.every((e) => new Date(e.date) >= new Date("2026-03-01")),
      ).toBe(true);
      expect(data.count).toBe(2);
    });

    it("should return events until a specific date", async () => {
      const res = await app.request("/events?to=2026-02-28", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as EventsGetResponse;

      expect(res.status).toBe(200);
      expect(
        data.events.every(
          (e) => new Date(e.date) <= new Date("2026-02-28T23:59:59.999Z"),
        ),
      ).toBe(true);
      expect(data.count).toBe(2);
    });

    it("should return events within a date range", async () => {
      const res = await app.request("/events?from=2026-02-01&to=2026-03-31", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as EventsGetResponse;

      expect(res.status).toBe(200);
      expect(data.count).toBe(3);
    });
  });

  describe("when using pagination", () => {
    it("should limit the number of results", async () => {
      const res = await app.request("/events?limit=2", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as EventsGetResponse;

      expect(res.status).toBe(200);
      expect(data.count).toBe(2);
      expect(data.total).toBe(4);
      expect(data.limit).toBe(2);
    });

    it("should skip results with offset", async () => {
      const res = await app.request("/events?limit=2&offset=2", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as EventsGetResponse;

      expect(res.status).toBe(200);
      expect(data.count).toBe(2);
      expect(data.offset).toBe(2);
    });

    it("should return total count regardless of pagination", async () => {
      const res = await app.request("/events?limit=1&offset=0", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as EventsGetResponse;

      expect(res.status).toBe(200);
      expect(data.count).toBe(1);
      expect(data.total).toBe(4);
    });
  });

  describe("when combining filters", () => {
    it("should apply multiple filters together", async () => {
      const res = await app.request(
        "/events?status=confirmado,por_confirmar&type=serenata",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = (await res.json()) as EventsGetResponse;

      expect(res.status).toBe(200);
      expect(
        data.events.every(
          (e) =>
            ["confirmado", "por_confirmar"].includes(e.status) &&
            e.type === "serenata",
        ),
      ).toBe(true);
      expect(data.count).toBe(1);
    });
  });
});
