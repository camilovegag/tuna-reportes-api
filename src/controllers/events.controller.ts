import { and, eq, gte, inArray, lte, SQL } from "drizzle-orm";
import type { Context } from "hono";
import { ERROR_CODES } from "../constants/error-codes";
import { db, dbSchema } from "../db";
import { eventStatus, eventType } from "../db/schema";
import {
  eventInsertSchema,
  eventSelectSchema,
  eventUpdateSchema,
} from "../schemas/events.schema";
import type { ErrorResponse } from "../types/error";
import type { EventPostResponse, EventsGetResponse } from "../types/event";
import type { AuthUserPayload } from "../types/auth";

export async function getEventsController(c: Context) {
  try {
    // Extract query params
    const statusParam = c.req.query("status");
    const typeParam = c.req.query("type");
    const fromParam = c.req.query("from");
    const toParam = c.req.query("to");
    const limitParam = c.req.query("limit");
    const offsetParam = c.req.query("offset");

    // Build conditions array
    const conditions: SQL[] = [];

    // Filter by status (comma-separated)
    if (statusParam) {
      const statuses = statusParam
        .split(",")
        .filter((s) => eventStatus.enumValues.includes(s as any));
      if (statuses.length > 0) {
        conditions.push(inArray(dbSchema.events.status, statuses as any[]));
      }
    }

    // Filter by type (comma-separated)
    if (typeParam) {
      const types = typeParam
        .split(",")
        .filter((t) => eventType.enumValues.includes(t as any));
      if (types.length > 0) {
        conditions.push(inArray(dbSchema.events.type, types as any[]));
      }
    }

    // Filter by date range
    if (fromParam) {
      conditions.push(gte(dbSchema.events.date, fromParam));
    }
    if (toParam) {
      // Add end of day to include the entire "to" date
      conditions.push(lte(dbSchema.events.date, `${toParam}T23:59:59.999Z`));
    }

    // Parse pagination
    const limit = limitParam
      ? Math.min(parseInt(limitParam, 10) || 50, 100)
      : 50;
    let offset = offsetParam ? parseInt(offsetParam, 10) : 0;
    if (Number.isNaN(offset) || offset < 0) {
      offset = 0;
    }

    // Build and execute query
    let query = db.select().from(dbSchema.events);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }

    // Get total count (before pagination)
    const allFiltered = await query;
    const total = allFiltered.length;

    // Apply pagination
    const events = allFiltered.slice(offset, offset + limit);

    const response: EventsGetResponse = {
      events,
      count: events.length,
      total,
      limit,
      offset,
    };
    return c.json(response, 200);
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

export async function getEventController(c: Context) {
  try {
    const id = c.req.param("id");
    const idResult = eventSelectSchema.shape.id.safeParse(id);

    if (!idResult.success) {
      const errorResponse: ErrorResponse = {
        error: {
          message: "Invalid event id format",
          code: ERROR_CODES.VALIDATION,
        },
      };
      return c.json(errorResponse, 400);
    }

    const [event] = await db
      .select()
      .from(dbSchema.events)
      .where(eq(dbSchema.events.id, idResult.data));

    if (!event) {
      const errorResponse: ErrorResponse = {
        error: {
          message: "Event not found",
          code: ERROR_CODES.NOT_FOUND,
        },
      };
      return c.json(errorResponse, 404);
    }

    return c.json(event, 200);
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

export async function createEventController(c: Context) {
  // zValidator already validated, but we parse to FILTER unwanted fields
  // (id, createdAt, etc.) that client may try to inject
  const body = await c.req.json();
  const data = eventInsertSchema.parse(body);
  const user = c.get("user") as AuthUserPayload;

  try {
    // Check for duplicate event (same name and date)
    const existing = await db
      .select()
      .from(dbSchema.events)
      .where(
        and(
          eq(dbSchema.events.name, data.name),
          eq(dbSchema.events.date, data.date),
        ),
      );

    if (existing.length > 0) {
      const errorResponse: ErrorResponse = {
        error: {
          message: "An event with this name and date already exists",
          code: ERROR_CODES.CONFLICT,
        },
      };
      return c.json(errorResponse, 409);
    }

    const insertData = {
      ...data,
      createdBy: user.userId,
    };

    const [inserted] = await db
      .insert(dbSchema.events)
      .values(insertData)
      .returning({ id: dbSchema.events.id });

    if (!inserted || !inserted.id) {
      const errorResponse: ErrorResponse = {
        error: {
          message: "Failed to create event",
          code: ERROR_CODES.INTERNAL,
        },
      };
      return c.json(errorResponse, 500);
    }

    const response: EventPostResponse = {
      id: inserted.id,
      message: "Event created",
    };
    return c.json(response, 201);
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

export async function updateEventController(c: Context) {
  const id = c.req.param("id");
  const idResult = eventSelectSchema.shape.id.safeParse(id);
  // zValidator already validated, but we parse to FILTER unwanted fields
  const body = await c.req.json();
  const data = eventUpdateSchema.parse(body);

  if (!idResult.success) {
    const errorResponse: ErrorResponse = {
      error: {
        message: "Invalid event id format",
        code: ERROR_CODES.VALIDATION,
      },
    };
    return c.json(errorResponse, 400);
  }

  if (Object.keys(data).length === 0) {
    return c.json(
      {
        error: {
          message: "No fields provided to update",
          code: ERROR_CODES.VALIDATION,
        },
      },
      400,
    );
  }

  const user = c.get("user") as AuthUserPayload;

  try {
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
      updatedBy: user.userId,
    };
    const [updatedEvent] = await db
      .update(dbSchema.events)
      .set(updateData)
      .where(eq(dbSchema.events.id, idResult.data))
      .returning();

    if (!updatedEvent) {
      const errorResponse: ErrorResponse = {
        error: {
          message: "Event not found",
          code: ERROR_CODES.NOT_FOUND,
        },
      };
      return c.json(errorResponse, 404);
    }

    return c.json(updatedEvent, 200);
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
