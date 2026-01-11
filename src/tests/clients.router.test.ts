import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import app from "../app";
import { db, dbSchema } from "../db";
import { clients } from "../db/schema";
import type { Client, ClientsGetResponse } from "../types/client";
import type { ErrorResponse } from "../types/error";
import type { Member } from "../types/member";
import { createTestUser, loginTestUser, seedTestMember } from "../utils/test";

describe("Clients Router", () => {
  let token: string;
  let member: Member;

  // Clean up database before and after tests
  const cleanup = async () => {
    await db.delete(clients);
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

  let createdClientId: string;

  it("POST /clients - should create a new client", async () => {
    const newClient = {
      name: "Test Client",
      phone: "1234567890",
      email: "test@client.com",
      notes: "Test notes",
    };

    const res = await app.request("/clients", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newClient),
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as Client;
    expect(body).toHaveProperty("id");
    expect(body.name).toBe(newClient.name);
    createdClientId = body.id;
  });

  it("GET /clients - should return a list of clients", async () => {
    const res = await app.request("/clients", {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as ClientsGetResponse;
    expect(Array.isArray(body.items)).toBe(true);
    expect(body.count).toBeGreaterThan(0);
  });

  it("GET /clients/:id - should return a specific client", async () => {
    const res = await app.request(`/clients/${createdClientId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as Client;
    expect(body.id).toBe(createdClientId);
  });

  it("PATCH /clients/:id - should update client details", async () => {
    const updateData = {
      name: "Updated Client Name",
      phone: "0987654321",
    };

    const res = await app.request(`/clients/${createdClientId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as Client;
    expect(body.name).toBe(updateData.name);
    expect(body.phone).toBe(updateData.phone);
  });

  it("PATCH /clients/:id - should reject empty update payload", async () => {
    const res = await app.request(`/clients/${createdClientId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
    const body = (await res.json()) as ErrorResponse;
    expect(body.error.message).toContain("No fields provided");
  });

  it("DELETE /clients/:id - should delete a client", async () => {
    const res = await app.request(`/clients/${createdClientId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as Client;
    expect(body.id).toBe(createdClientId);

    // Verify deletion
    const checkRes = await app.request(`/clients/${createdClientId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(checkRes.status).toBe(404);
  });
});
