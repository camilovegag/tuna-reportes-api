# AGENTS.md - Tuna Reportes API

Guidelines for AI agents working in this codebase.

## Tech Stack

- **Runtime**: Bun v1.2.8+
- **Framework**: Hono v4
- **Language**: TypeScript 5 (strict mode)
- **Database**: PostgreSQL with Drizzle ORM
- **Validation**: Zod v4 (import from `zod/v4`)
- **Authentication**: JWT via hono/jwt

## Project Structure

```
src/
├── app/           # Hono app config, CORS, route mounting
├── constants/     # App constants (error codes, roles)
├── controllers/   # Request handlers with business logic
├── db/            # Drizzle config, schema, relations
├── middlewares/   # Auth, role verification
├── routers/       # Route definitions with validation
├── schemas/       # Zod validation schemas (drizzle-zod)
├── scripts/       # DB seed/clean scripts
├── tests/         # Integration tests (*.router.test.ts)
├── types/         # TypeScript type definitions
├── utils/         # Utilities (validator, test helpers)
└── index.ts       # Entry point (Bun.serve)
```

## Build/Lint/Test Commands

```bash
# Development
bun run dev              # Start server with hot-reload

# Testing
bun test                 # Run all tests
bun test --watch         # Watch mode
bun test src/tests/events.router.test.ts   # Run single test file
bun test -t "test name"  # Run test by name pattern

# Linting & Formatting
bun run lint             # ESLint
bun run format           # Prettier

# Database
bun run db:migrate       # Apply migrations
bun run db:generate      # Generate new migrations
bun run db:studio        # Open Drizzle Studio
bun run db:seed          # Seed test data
bun run db:clean         # Clean database
bun run db:drop          # Drop migrations
```

## Code Style

### Formatting (Prettier)

- Semicolons: required
- Quotes: double quotes
- Trailing commas: all
- Indent: 2 spaces
- Line width: 80 characters

### Imports

```typescript
// External packages first
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, and } from "drizzle-orm";
import { z } from "zod/v4"; // Always import from zod/v4

// Local imports (no .ts extension needed)
import { db, dbSchema } from "../db";
import { ERROR_CODES } from "../constants/error-codes";

// Type imports use 'import type'
import type { Context } from "hono";
import type { ErrorResponse } from "../types/error";
```

### Naming Conventions

| Category           | Convention             | Example                                  |
| ------------------ | ---------------------- | ---------------------------------------- |
| Files              | kebab-case             | `events.router.ts`, `auth.middleware.ts` |
| Types              | PascalCase             | `Event`, `EventsGetResponse`             |
| Functions          | camelCase              | `getEventsController`                    |
| Constants          | SCREAMING_SNAKE        | `ERROR_CODES`, `ROLES`                   |
| DB columns         | snake_case             | `created_at`, `member_id`                |
| Routes             | kebab-case plurals     | `/events`, `/serenade-bookings`          |
| Router exports     | camelCase + Router     | `eventsRouter`                           |
| Controller exports | camelCase + Controller | `getEventsController`                    |
| Schema exports     | camelCase + Schema     | `eventInsertSchema`                      |

## Patterns

### Router Pattern

```typescript
const eventsRouter = new Hono()
  .get("/:id", authMiddleware, getEventController)
  .post(
    "/",
    authMiddleware,
    requireRole([ROLES.ADMIN, ROLES.EDITOR]),
    zValidator("json", eventInsertSchema, validatorErrorHandler),
    createEventController,
  );

export default eventsRouter;
export type EventsRouterType = typeof eventsRouter;
```

### Controller Pattern

```typescript
export async function getEventsController(c: Context) {
  try {
    const events = await db.select().from(dbSchema.events);
    return c.json({ events }, 200);
  } catch (error) {
    const errorResponse: ErrorResponse = {
      error: {
        message:
          error instanceof Error ? error.message : "Internal server error",
        code: ERROR_CODES.INTERNAL,
      },
    };
    return c.json(errorResponse, 500);
  }
}
```

### Schema Pattern (drizzle-zod)

```typescript
// Omit system-managed fields for insert/update schemas
export const eventInsertSchema = createInsertSchema(dbSchema.events)
  .omit({
    id: true,
    createdAt: true,
    createdBy: true,
    updatedAt: true,
    updatedBy: true,
  })
  .extend({
    name: z.string().min(3, "Name must be at least 3 characters"),
  });

export const eventUpdateSchema = createUpdateSchema(dbSchema.events)
  .omit({
    id: true,
    createdAt: true,
    createdBy: true,
    updatedAt: true,
    updatedBy: true,
  })
  .strict();
```

## Error Handling

### Standard ErrorResponse Type

```typescript
type ErrorResponse = {
  error: {
    message: string;
    details?: Record<string, string[]>; // For validation errors
    code: string;
  };
};
```

### Error Codes and HTTP Status Mapping

| Status | Code             | Usage                       |
| ------ | ---------------- | --------------------------- |
| 400    | VALIDATION_ERROR | Bad request, invalid format |
| 401    | UNAUTHORIZED     | Invalid/missing token       |
| 403    | FORBIDDEN        | Insufficient permissions    |
| 404    | NOT_FOUND        | Resource not found          |
| 409    | CONFLICT         | Duplicate resource          |
| 500    | INTERNAL_ERROR   | Unexpected errors           |

Always wrap controller logic in try/catch and return standardized error responses.

## Testing

Tests are integration tests using Bun's test runner and `app.request()`.

```typescript
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import app from "../app";
import { db, dbSchema } from "../db";

let token: string;

beforeEach(async () => {
  // Setup: seed data and authenticate
  const member = await seedTestMember();
  await createTestUser({}, member.vinculationCode);
  const response = await loginTestUser("user@email.com", "password");
  token = response.data.token;
});

afterEach(async () => {
  // Cleanup: delete test data in correct order (FK constraints)
  await db.delete(dbSchema.events);
  await db.delete(dbSchema.users);
  await db.delete(dbSchema.members);
});

describe("POST /events", () => {
  it("should respond with 201 Created", async () => {
    const response = await app.request("/events", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(eventData),
    });
    expect(response.status).toBe(201);
  });
});
```

## Important Notes

- Always use `zod/v4` import path, not `zod`
- DB uses snake_case columns but TS uses camelCase properties
- Routes are plural nouns in kebab-case
- RBAC via `requireRole([ROLES.ADMIN, ROLES.EDITOR])` middleware
- Test cleanup must respect foreign key constraints (delete child tables first)
- Pre-commit hook runs lint-staged (ESLint + Prettier on staged files)
