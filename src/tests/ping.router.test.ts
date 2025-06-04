import { describe, it, expect, beforeEach } from "bun:test";
import app from "../app";

describe("GET /ping", () => {
  let response: Response;
  beforeEach(async () => {
    response = await app.request("/ping");
  });

  it("should respond with 200", async () => {
    expect(response.status).toBe(200);
  });

  it("should respond with {message: 'pong 🏓'}", async () => {
    const data = await response.json();
    expect(data).toEqual({ message: "pong 🏓" });
  });
});
