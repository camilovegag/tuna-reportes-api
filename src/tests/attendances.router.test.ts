import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import app from "../app";
import { db, dbSchema } from "../db";
import type { AuthLoginPostResponse } from "../types/auth";
import type {
  Attendance,
  AttendanceDeleteResponse,
  AttendancePostResponse,
  AttendancesGetResponse,
  AttendanceUpdateResponse,
} from "../types/attendance";
import type { ErrorResponse } from "../types/error";
import {
  createTestEvent,
  createTestUser,
  loginTestUser,
  seedTestMember,
} from "../utils/test";

let user: AuthLoginPostResponse;
let eventId: string;
let memberId: string;

beforeEach(async () => {
  const member = await seedTestMember();
  memberId = member.id;
  await createTestUser({}, member.vinculationCode);
  const { data } = await loginTestUser("user@email.com", "password");
  user = data as AuthLoginPostResponse;

  // Create a test event
  const { data: eventData } = await createTestEvent({}, user.token);
  eventId = eventData.id;
});

afterEach(async () => {
  await db.delete(dbSchema.attendances);
  await db.delete(dbSchema.events);
  await db.delete(dbSchema.users);
  await db.delete(dbSchema.members);
});

describe("GET /attendances", () => {
  describe("when there are no filters", () => {
    let response: Response;
    let data: AttendancesGetResponse;

    beforeEach(async () => {
      // Create test attendance
      await app.request("/attendances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          eventId,
          memberId,
          status: "asiste",
        }),
      });

      response = await app.request("/attendances", {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      data = (await response.json()) as AttendancesGetResponse;
    });

    it("should respond with 200 OK", () => {
      expect(response.status).toBe(200);
    });

    it("should return an array of attendances", () => {
      expect(data.attendances).toBeArray();
      expect(data.count).toBe(1);
    });
  });

  describe("when filtering by eventId", () => {
    let response: Response;
    let data: AttendancesGetResponse;

    beforeEach(async () => {
      await app.request("/attendances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          eventId,
          memberId,
          status: "asiste",
        }),
      });

      response = await app.request(`/attendances?eventId=${eventId}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      data = (await response.json()) as AttendancesGetResponse;
    });

    it("should respond with 200 OK", () => {
      expect(response.status).toBe(200);
    });

    it("should return attendances for that event", () => {
      expect(data.attendances).toBeArray();
      expect(data.count).toBe(1);
      expect(data.attendances[0]?.eventId).toBe(eventId);
    });
  });
});

describe("POST /attendances", () => {
  describe("when the request is valid", () => {
    let response: Response;
    let data: AttendancePostResponse;

    beforeEach(async () => {
      response = await app.request("/attendances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          eventId,
          memberId,
          status: "asiste",
        }),
      });
      data = (await response.json()) as AttendancePostResponse;
    });

    it("should respond with 201 Created", () => {
      expect(response.status).toBe(201);
    });

    it("should return a confirmation message and the attendance id", () => {
      expect(data).toHaveProperty("id");
      expect(typeof data.id).toBe("string");
      expect(data.message).toBe("Attendance created");
    });
  });

  describe("when attendance already exists for event + member", () => {
    let response: Response;
    let data: ErrorResponse;

    beforeEach(async () => {
      // Create first attendance
      await app.request("/attendances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          eventId,
          memberId,
          status: "asiste",
        }),
      });

      // Try to create duplicate
      response = await app.request("/attendances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          eventId,
          memberId,
          status: "no_asiste",
        }),
      });
      data = (await response.json()) as ErrorResponse;
    });

    it("should respond with 400 Bad Request", () => {
      expect(response.status).toBe(400);
      expect(data.error.message).toBe(
        "Attendance already exists for this event and member",
      );
    });
  });
});

describe("PATCH /attendances/:id", () => {
  describe("when the attendance exists and request is valid", () => {
    let response: Response;
    let data: AttendanceUpdateResponse;
    let attendanceId: string;

    beforeEach(async () => {
      // Create attendance
      const createResponse = await app.request("/attendances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          eventId,
          memberId,
          status: "por_confirmar",
        }),
      });
      const createData =
        (await createResponse.json()) as AttendancePostResponse;
      attendanceId = createData.id;

      // Update attendance
      response = await app.request(`/attendances/${attendanceId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ status: "asiste" }),
      });
      data = (await response.json()) as AttendanceUpdateResponse;
    });

    it("should respond with 200 OK", () => {
      expect(response.status).toBe(200);
    });

    it("should update and return the attendance", () => {
      expect(data.id).toBe(attendanceId);
      expect(data.message).toBe("Attendance updated");
    });
  });

  describe("when the attendance does not exist", () => {
    let response: Response;
    let data: ErrorResponse;
    const fakeId = "38bd666b-cf64-41d8-8d79-ffffffffffff";

    beforeEach(async () => {
      response = await app.request(`/attendances/${fakeId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ status: "asiste" }),
      });
      data = (await response.json()) as ErrorResponse;
    });

    it("should respond with 404 Not Found", () => {
      expect(response.status).toBe(404);
      expect(data.error.message).toBe("Attendance not found");
    });
  });
});

describe("DELETE /attendances/:id", () => {
  describe("when the attendance exists", () => {
    let response: Response;
    let data: AttendanceDeleteResponse;
    let attendanceId: string;

    beforeEach(async () => {
      // Create attendance
      const createResponse = await app.request("/attendances", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          eventId,
          memberId,
          status: "asiste",
        }),
      });
      const createData =
        (await createResponse.json()) as AttendancePostResponse;
      attendanceId = createData.id;

      // Delete attendance
      response = await app.request(`/attendances/${attendanceId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      data = (await response.json()) as AttendanceDeleteResponse;
    });

    it("should respond with 200 OK", () => {
      expect(response.status).toBe(200);
    });

    it("should return the attendance id and a message", () => {
      expect(data).toHaveProperty("id", attendanceId);
      expect(data).toHaveProperty("message", "Attendance deleted");
    });
  });

  describe("when the attendance does not exist", () => {
    let response: Response;
    let data: ErrorResponse;
    const fakeId = "38bd666b-cf64-41d8-8d79-ffffffffffff";

    beforeEach(async () => {
      response = await app.request(`/attendances/${fakeId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      data = (await response.json()) as ErrorResponse;
    });

    it("should respond with 404 Not Found", () => {
      expect(response.status).toBe(404);
      expect(data.error.message).toBe("Attendance not found");
    });
  });
});
