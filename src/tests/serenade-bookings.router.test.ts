import { describe, expect, it, beforeAll, afterAll } from "bun:test";
import app from "../app";
import { db, dbSchema } from "../db";
import { serenadeBookings, clients, events } from "../db/schema";
import type {
  SerenadeBooking,
  SerenadeBookingsGetResponse,
} from "../types/serenade-booking";
import { createTestUser, loginTestUser, seedTestMember } from "../utils/test";
import type { Member } from "../types/member";
import type { ErrorResponse } from "../types/error";

describe("Serenade Bookings Router", () => {
  let token: string;
  let member: Member;

  // Clean up database before and after tests
  const cleanup = async () => {
    await db.delete(serenadeBookings);
    await db.delete(clients);
    await db.delete(events);
    await db.delete(dbSchema.users);
    await db.delete(dbSchema.members);
  };

  beforeAll(async () => {
    await cleanup();
    member = await seedTestMember();
    await createTestUser({ email: "admin@email.com" }, member.vinculationCode);
    const response = await loginTestUser("admin@email.com", "password");
    if ("token" in response.data) {
      token = response.data.token;
    } else {
      throw new Error("Failed to login test user");
    }
  });

  afterAll(async () => {
    await cleanup();
  });

  let createdSerenadeBookingId: string;
  let clientId: string;
  let eventId: string;

  it("POST /serenade-bookings - should create a new serenade booking", async () => {
    // Create client and event dependencies
    const clientRes = await db
      .insert(clients)
      .values({
        name: "Test Client",
        phone: "1234567890",
        email: "test@client.com",
      })
      .returning();

    if (!clientRes[0]) throw new Error("Failed to create test client");
    clientId = clientRes[0].id;

    const eventRes = await db
      .insert(events)
      .values({
        name: "Test Event",
        date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        location: "Test Location",
        type: "serenata",
      })
      .returning();

    if (!eventRes[0]) throw new Error("Failed to create test event");
    eventId = eventRes[0].id;

    const newBooking = {
      eventId: eventId,
      clientId: clientId,
      price: 150000,
      transportationCost: 50000,
      occasion: "cumpleanos",
      occasionDetails: "25th Birthday",
      specialRequests: "Play Happy Birthday",
    };

    const res = await app.request("/serenade-bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newBooking),
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as SerenadeBooking;
    expect(body).toHaveProperty("id");
    expect(body.price).toBe(newBooking.price);
    createdSerenadeBookingId = body.id;
  });

  it("POST /serenade-bookings - should reject negative price", async () => {
    const badBooking = {
      eventId: eventId,
      clientId: clientId,
      price: -1000,
      occasion: "cumpleanos",
    };

    const res = await app.request("/serenade-bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(badBooking),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as ErrorResponse;
    expect(body.error.details?.price?.[0]).toContain("non-negative");
  });

  it("POST /serenade-bookings - should reject duplicate eventId", async () => {
    const duplicateBooking = {
      eventId: eventId,
      clientId: clientId,
      price: 200000,
      occasion: "matrimonio",
    };

    const res = await app.request("/serenade-bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(duplicateBooking),
    });

    expect(res.status).toBe(409);
    const body = (await res.json()) as ErrorResponse;
    expect(body.error.message).toContain("already exists");
  });

  it("GET /serenade-bookings - should return a list of serenade bookings", async () => {
    const res = await app.request("/serenade-bookings", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as SerenadeBookingsGetResponse;
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.count).toBeGreaterThan(0);
  });

  it("GET /serenade-bookings/:id - should return a specific serenade booking", async () => {
    const res = await app.request(
      `/serenade-bookings/${createdSerenadeBookingId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as SerenadeBooking;
    expect(body.id).toBe(createdSerenadeBookingId);
  });

  it("PATCH /serenade-bookings/:id - should update serenade booking details", async () => {
    const updateData = {
      price: 200000,
      occasionDetails: "Updated details",
    };

    const res = await app.request(
      `/serenade-bookings/${createdSerenadeBookingId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      },
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as SerenadeBooking;
    expect(body.price).toBe(updateData.price);
    expect(body.occasionDetails).toBe(updateData.occasionDetails);
  });

  it("PATCH /serenade-bookings/:id - should reject empty update payload", async () => {
    const res = await app.request(
      `/serenade-bookings/${createdSerenadeBookingId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      },
    );

    expect(res.status).toBe(400);
    const body = (await res.json()) as ErrorResponse;
    expect(body.error.message).toContain("No fields provided");
  });

  it("DELETE /serenade-bookings/:id - should delete a serenade booking", async () => {
    const res = await app.request(
      `/serenade-bookings/${createdSerenadeBookingId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as SerenadeBooking;
    expect(body.id).toBe(createdSerenadeBookingId);

    // Verify deletion
    const checkRes = await app.request(
      `/serenade-bookings/${createdSerenadeBookingId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    expect(checkRes.status).toBe(404);
  });
});
