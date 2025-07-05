if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set.");
}

import app from "./app";

Bun.serve({
  fetch: app.fetch,
  port: 3000,
});

console.log("Server running on http://localhost:3000");
