import type { Context } from "hono";
import { z } from "zod/v4";
import { ERROR_CODES } from "../constants/error-codes";
import { db, dbSchema } from "../db";
import { eventInsertSchema } from "../schemas/events.schema";
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
