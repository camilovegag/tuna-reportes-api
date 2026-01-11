import { and, eq, gte, inArray, lte, type SQL } from "drizzle-orm";
import { ERROR_CODES } from "../constants/error-codes";
import { db, dbSchema } from "../db";
import { eventStatus, eventType } from "../db/schema";
import {
  eventInsertSchema,
  eventSelectSchema,
  eventUpdateSchema,
} from "../schemas/events.schema";
import type {
  Event,
  EventPostResponse,
  EventsGetResponse,
} from "../types/event";
import type { ServiceResult } from "../types/service";

export type EventFilters = {
  status?: string;
  type?: string;
  from?: string;
  to?: string;
  limit?: string;
  offset?: string;
};

export type EventInsertInput = {
  name: string;
  date: string;
  type: string;
  location: string;
  description?: string | null;
  status?: string;
  isInternational?: boolean | null;
};

export type EventUpdateInput = {
  name?: string;
  date?: string;
  type?: string;
  location?: string;
  description?: string | null;
  status?: string;
  isInternational?: boolean | null;
};

export async function getEvents(
  filters: EventFilters,
): Promise<ServiceResult<EventsGetResponse>> {
  try {
    const conditions: SQL[] = [];

    // Filter by status (comma-separated)
    if (filters.status) {
      const statuses = filters.status
        .split(",")
        .filter((s) => eventStatus.enumValues.includes(s as never));
      if (statuses.length > 0) {
        conditions.push(inArray(dbSchema.events.status, statuses as never[]));
      }
    }

    // Filter by type (comma-separated)
    if (filters.type) {
      const types = filters.type
        .split(",")
        .filter((t) => eventType.enumValues.includes(t as never));
      if (types.length > 0) {
        conditions.push(inArray(dbSchema.events.type, types as never[]));
      }
    }

    // Filter by date range
    if (filters.from) {
      conditions.push(gte(dbSchema.events.date, filters.from));
    }
    if (filters.to) {
      conditions.push(lte(dbSchema.events.date, `${filters.to}T23:59:59.999Z`));
    }

    // Parse pagination
    const limit = filters.limit
      ? Math.min(parseInt(filters.limit, 10) || 50, 100)
      : 50;
    let offset = filters.offset ? parseInt(filters.offset, 10) : 0;
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

    return {
      success: true,
      data: {
        events,
        count: events.length,
        total,
        limit,
        offset,
      },
    };
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

export async function getEventById(id: string): Promise<ServiceResult<Event>> {
  try {
    const idResult = eventSelectSchema.shape.id.safeParse(id);

    if (!idResult.success) {
      return {
        success: false,
        error: {
          message: "Invalid event id format",
          code: ERROR_CODES.VALIDATION,
        },
        status: 400,
      };
    }

    const [event] = await db
      .select()
      .from(dbSchema.events)
      .where(eq(dbSchema.events.id, idResult.data));

    if (!event) {
      return {
        success: false,
        error: {
          message: "Event not found",
          code: ERROR_CODES.NOT_FOUND,
        },
        status: 404,
      };
    }

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

export async function createEvent(
  data: EventInsertInput,
  userId: string,
): Promise<ServiceResult<EventPostResponse>> {
  try {
    const parsed = eventInsertSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: {
          message: "Validation failed",
          code: ERROR_CODES.VALIDATION,
        },
        status: 400,
      };
    }

    // Check for duplicate event (same name and date)
    const existing = await db
      .select()
      .from(dbSchema.events)
      .where(
        and(
          eq(dbSchema.events.name, parsed.data.name),
          eq(dbSchema.events.date, parsed.data.date),
        ),
      );

    if (existing.length > 0) {
      return {
        success: false,
        error: {
          message: "An event with this name and date already exists",
          code: ERROR_CODES.CONFLICT,
        },
        status: 409,
      };
    }

    const insertData = {
      ...parsed.data,
      createdBy: userId,
    };

    const [inserted] = await db
      .insert(dbSchema.events)
      .values(insertData)
      .returning({ id: dbSchema.events.id });

    if (!inserted || !inserted.id) {
      return {
        success: false,
        error: {
          message: "Failed to create event",
          code: ERROR_CODES.INTERNAL,
        },
        status: 500,
      };
    }

    return {
      success: true,
      data: {
        id: inserted.id,
        message: "Event created",
      },
    };
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

export async function updateEvent(
  id: string,
  data: EventUpdateInput,
  userId: string,
): Promise<ServiceResult<Event>> {
  try {
    const idResult = eventSelectSchema.shape.id.safeParse(id);

    if (!idResult.success) {
      return {
        success: false,
        error: {
          message: "Invalid event id format",
          code: ERROR_CODES.VALIDATION,
        },
        status: 400,
      };
    }

    const parsed = eventUpdateSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: {
          message: "Validation failed",
          code: ERROR_CODES.VALIDATION,
        },
        status: 400,
      };
    }

    if (Object.keys(parsed.data).length === 0) {
      return {
        success: false,
        error: {
          message: "No fields provided to update",
          code: ERROR_CODES.VALIDATION,
        },
        status: 400,
      };
    }

    const updateData = {
      ...parsed.data,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    };

    const [updatedEvent] = await db
      .update(dbSchema.events)
      .set(updateData)
      .where(eq(dbSchema.events.id, idResult.data))
      .returning();

    if (!updatedEvent) {
      return {
        success: false,
        error: {
          message: "Event not found",
          code: ERROR_CODES.NOT_FOUND,
        },
        status: 404,
      };
    }

    return { success: true, data: updatedEvent };
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
