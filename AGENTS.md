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
├── db/            # Drizzle config, schema, relations
├── middlewares/   # Auth, role verification, validation
├── routers/       # Route definitions (thin layer)
├── schemas/       # Zod validation schemas (drizzle-zod)
├── scripts/       # DB seed/clean scripts
├── services/      # Business logic layer
├── tests/         # Integration tests (*.router.test.ts)
├── types/         # TypeScript type definitions
├── utils/         # Utilities (validator, test helpers)
└── index.ts       # Entry point (Bun.serve)
```

## Build/Lint/Test Commands

```bash
bun run dev                                # Start server with hot-reload
bun test                                   # Run all tests
bun test --watch                           # Watch mode
bun test src/tests/events.router.test.ts   # Run single test file
bun test -t "test name"                    # Run test by name pattern
bun run lint                               # ESLint
bun run format                             # Prettier
bun run db:migrate                         # Apply migrations
bun run db:generate                        # Generate new migrations
bun run db:studio                          # Open Drizzle Studio
bun run db:seed                            # Seed test data
bun run db:clean                           # Clean database
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
import { eq, and } from "drizzle-orm";
import { z } from "zod/v4"; // Always use zod/v4, NOT zod

// Local imports (no .ts extension)
import { db, dbSchema } from "../db";
import { ERROR_CODES } from "../constants/error-codes";

// Type imports use 'import type'
import type { ServiceResult } from "../types/service";
```

### Naming Conventions

| Category        | Convention         | Example                                 |
| --------------- | ------------------ | --------------------------------------- |
| Files           | kebab-case         | `events.router.ts`, `events.service.ts` |
| Types           | PascalCase         | `Event`, `EventsGetResponse`            |
| Functions       | camelCase          | `getEvents`, `createEvent`              |
| Constants       | SCREAMING_SNAKE    | `ERROR_CODES`, `ROLES`                  |
| DB columns      | snake_case         | `created_at`, `member_id`               |
| Routes          | kebab-case plurals | `/events`, `/serenade-bookings`         |
| Router exports  | camelCase + Router | `eventsRouter`                          |
| Service exports | camelCase          | `getEvents`, `createEvent`              |
| Schema exports  | camelCase + Schema | `eventInsertSchema`                     |

## Architecture Patterns

### Router Pattern (thin layer - delegates to services)

```typescript
const eventsRouter = new Hono()
  .get("/", authMiddleware, async (c) => {
    const result = await getEvents(filters);
    if (!result.success) return c.json({ error: result.error }, result.status);
    return c.json(result.data, 200);
  })
  .post(
    "/",
    authMiddleware,
    requireRole([ROLES.ADMIN]),
    jsonValidator(eventInsertSchema),
    async (c) => {
      const body = c.req.valid("json");
      const result = await createEvent(body, c.get("user").userId);
      if (!result.success)
        return c.json({ error: result.error }, result.status);
      return c.json(result.data, 201);
    },
  );

export default eventsRouter;
export type EventsRouterType = typeof eventsRouter;
```

### Service Pattern (business logic with ServiceResult)

```typescript
export async function getEventById(id: string): Promise<ServiceResult<Event>> {
  try {
    const [event] = await db
      .select()
      .from(dbSchema.events)
      .where(eq(dbSchema.events.id, id));
    if (!event)
      return {
        success: false,
        error: { message: "Event not found", code: ERROR_CODES.NOT_FOUND },
        status: 404,
      };
    return { success: true, data: event };
  } catch (error) {
    return {
      success: false,
      error: {
        message:
          error instanceof Error ? error.message : "Internal server error",
        code: ERROR_CODES.INTERNAL,
      },
      status: 500,
    };
  }
}
```

### Schema Pattern (drizzle-zod)

```typescript
export const eventInsertSchema = createInsertSchema(dbSchema.events)
  .omit({
    id: true,
    createdAt: true,
    createdBy: true,
    updatedAt: true,
    updatedBy: true,
  })
  .extend({ name: z.string().min(3, "Name must be at least 3 characters") });

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

| Status | Code             | Usage                       |
| ------ | ---------------- | --------------------------- |
| 400    | VALIDATION_ERROR | Bad request, invalid format |
| 401    | UNAUTHORIZED     | Invalid/missing token       |
| 403    | FORBIDDEN        | Insufficient permissions    |
| 404    | NOT_FOUND        | Resource not found          |
| 409    | CONFLICT         | Duplicate resource          |
| 500    | INTERNAL_ERROR   | Unexpected errors           |

## Testing

Integration tests using Bun's test runner and `app.request()`. Use helpers from `src/utils/test.ts`.

```typescript
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import app from "../app";
import { db, dbSchema } from "../db";
import { seedTestMember, createTestUser, loginTestUser } from "../utils/test";

let token: string;

beforeEach(async () => {
  const member = await seedTestMember();
  await createTestUser({}, member.vinculationCode);
  token = (await loginTestUser("user@email.com", "password")).data.token;
});

afterEach(async () => {
  // Cleanup in FK-constraint order (children first)
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

- Always use `zod/v4` import path, never `zod`
- DB uses snake_case columns but TS uses camelCase properties
- Routes are plural nouns in kebab-case
- RBAC via `requireRole([ROLES.ADMIN, ROLES.EDITOR])` middleware
- Test cleanup must respect foreign key constraints (delete child tables first)
- Pre-commit hook runs lint-staged (ESLint + Prettier on staged files)
- Services return `ServiceResult<T>` - routers handle success/error branching
