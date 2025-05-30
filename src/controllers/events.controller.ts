import { eq } from "drizzle-orm";
import type { Context } from "hono";
import { z } from "zod/v4";
import { ERROR_CODES } from "../constants/error-codes";
import { db, dbSchema } from "../db";
import {
  eventInsertSchema,
  eventSelectSchema,
  eventUpdateSchema,
} from "../schemas/events.schema";
import type { ErrorResponse } from "../types/error";
import type { EventPostResponse, EventsGetResponse } from "../types/event";

export async function getEventsController(c: Context) {
  try {
    const events = await db.select().from(dbSchema.events);
    const response: EventsGetResponse = { events, count: events.length };
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
  const body = await c.req.json();
  const result = eventInsertSchema.safeParse(body);

  if (!result.success) {
    const tree = z.treeifyError(result.error);
    const flatErrors = Object.fromEntries(
      Object.entries(tree.properties ?? {}).map(([key, value]) => [
        key,
        value.errors,
      ]),
    );

    const errorResponse: ErrorResponse = {
      error: {
        message: "Validation failed",
        details: flatErrors,
        code: ERROR_CODES.VALIDATION,
      },
    };
    return c.json(errorResponse, 400);
  }

  try {
    const [data] = await db
      .insert(dbSchema.events)
      .values(result.data)
      .returning({ id: dbSchema.events.id });

    const response: EventPostResponse = {
      id: data?.id,
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
  const id = await c.req.param("id");
  const idResult = eventSelectSchema.shape.id.safeParse(id);
  const body = await c.req.json();
  const result = eventUpdateSchema.safeParse(body);

  if (!idResult.success) {
    const errorResponse: ErrorResponse = {
      error: {
        message: "Invalid event id format",
        code: ERROR_CODES.VALIDATION,
      },
    };
    return c.json(errorResponse, 400);
  }

  if (!result.success) {
    const errorResponse: ErrorResponse = {
      error: {
        message: "Validation error",
        code: ERROR_CODES.VALIDATION,
      },
    };
    return c.json(errorResponse, 400);
  }

  if (Object.keys(result.data).length === 0) {
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

  try {
    const updateData = {
      ...result.data,
      updatedAt: new Date().toISOString(),
    };
    const [updatedEvent] = await db
      .update(dbSchema.events)
      .set(updateData)
      .where(eq(dbSchema.events.id, id))
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
