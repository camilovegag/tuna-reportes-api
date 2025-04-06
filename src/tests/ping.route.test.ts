import { describe, it, expect } from "bun:test";
import app from "../app";

describe("GET /ping", () => {
  it("should respond with 200", async () => {
    const response = await app.request("/ping");
    expect(response.status).toBe(200);
  });

  it("should respond with {message: 'pong 🏓'}", async () => {
    const response = await app.request("/ping");
    const data = await response.json();
    expect(data).toEqual({ message: "pong 🏓" });
  });
});
