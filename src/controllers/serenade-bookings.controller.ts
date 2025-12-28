import { eq, desc } from "drizzle-orm";
import type { Context } from "hono";
import { z } from "zod/v4";
import { db } from "../db";
import { serenadeBookings } from "../db/schema";
import {
  serenadeBookingInsertSchema,
  serenadeBookingUpdateSchema,
  serenadeBookingIdSchema,
} from "../schemas/serenade-bookings.schema";
import type { ErrorResponse } from "../types/error";
import type {
  SerenadeBooking,
  SerenadeBookingsGetResponse,
} from "../types/serenade-booking";
import { ERROR_CODES } from "../constants/error-codes";

export const getSerenadeBookings = async (c: Context): Promise<Response> => {
  try {
    const result = await db
      .select()
      .from(serenadeBookings)
      .orderBy(desc(serenadeBookings.createdAt));
    const response: SerenadeBookingsGetResponse = {
      items: result,
      count: result.length,
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
};

export const getSerenadeBookingById = async (c: Context): Promise<Response> => {
  const id = c.req.param("id");
  const idValidation = serenadeBookingIdSchema.shape.id.safeParse(id);

  if (!idValidation.success) {
    const errorResponse: ErrorResponse = {
      error: {
        message: "Invalid serenade booking ID format",
        code: ERROR_CODES.VALIDATION,
      },
    };
    return c.json(errorResponse, 400);
  }

  try {
    const result = await db
      .select()
      .from(serenadeBookings)
      .where(eq(serenadeBookings.id, id));

    if (result.length === 0) {
      const errorResponse: ErrorResponse = {
        error: {
          message: "Serenade booking not found",
          code: ERROR_CODES.NOT_FOUND,
        },
      };
      return c.json(errorResponse, 404);
    }

    return c.json(result[0], 200);
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
};

export const createSerenadeBooking = async (c: Context): Promise<Response> => {
  try {
    const body = await c.req.json();
    const validation = serenadeBookingInsertSchema.safeParse(body);

    if (!validation.success) {
      const tree = z.treeifyError(validation.error);
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

    const result = await db
      .insert(serenadeBookings)
      .values(validation.data)
      .returning();

    if (!result[0]) {
      const errorResponse: ErrorResponse = {
        error: {
          message: "Failed to create serenade booking",
          code: ERROR_CODES.INTERNAL,
        },
      };
      return c.json(errorResponse, 500);
    }

    return c.json(result[0], 201);
  } catch (error: any) {
    // Foreign key constraint violation
    if (error.code === "23503") {
      const errorResponse: ErrorResponse = {
        error: {
          message: "Client or Event not found",
          code: ERROR_CODES.NOT_FOUND,
        },
      };
      return c.json(errorResponse, 404);
    }

    // Unique constraint violation (duplicate eventId)
    if (error.code === "23505") {
      const errorResponse: ErrorResponse = {
        error: {
          message: "A serenade booking already exists for this event",
          code: ERROR_CODES.CONFLICT,
        },
      };
      return c.json(errorResponse, 409);
    }

    const errorResponse: ErrorResponse = {
      error: {
        message:
          error instanceof Error ? error.message : "Internal server error",
        code: ERROR_CODES.INTERNAL,
      },
    };
    return c.json(errorResponse, 500);
  }
};

export const updateSerenadeBooking = async (c: Context): Promise<Response> => {
  const id = c.req.param("id");
  const idValidation = serenadeBookingIdSchema.shape.id.safeParse(id);

  if (!idValidation.success) {
    const errorResponse: ErrorResponse = {
      error: {
        message: "Invalid serenade booking ID format",
        code: ERROR_CODES.VALIDATION,
      },
    };
    return c.json(errorResponse, 400);
  }

  try {
    const body = await c.req.json();
    const validation = serenadeBookingUpdateSchema.safeParse(body);

    if (!validation.success) {
      const tree = z.treeifyError(validation.error);
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

    if (Object.keys(validation.data).length === 0) {
      const errorResponse: ErrorResponse = {
        error: {
          message: "No fields provided to update",
          code: ERROR_CODES.VALIDATION,
        },
      };
      return c.json(errorResponse, 400);
    }

    const updateData = {
      ...validation.data,
      updatedAt: new Date().toISOString(),
    };

    const result = await db
      .update(serenadeBookings)
      .set(updateData)
      .where(eq(serenadeBookings.id, id))
      .returning();

    if (result.length === 0) {
      const errorResponse: ErrorResponse = {
        error: {
          message: "Serenade booking not found",
          code: ERROR_CODES.NOT_FOUND,
        },
      };
      return c.json(errorResponse, 404);
    }

    return c.json(result[0], 200);
  } catch (error: any) {
    // Unique constraint violation when updating eventId
    if (error.code === "23505") {
      const errorResponse: ErrorResponse = {
        error: {
          message: "A serenade booking already exists for this event",
          code: ERROR_CODES.CONFLICT,
        },
      };
      return c.json(errorResponse, 409);
    }

    const errorResponse: ErrorResponse = {
      error: {
        message:
          error instanceof Error ? error.message : "Internal server error",
        code: ERROR_CODES.INTERNAL,
      },
    };
    return c.json(errorResponse, 500);
  }
};

export const deleteSerenadeBooking = async (c: Context): Promise<Response> => {
  const id = c.req.param("id");
  const idValidation = serenadeBookingIdSchema.shape.id.safeParse(id);

  if (!idValidation.success) {
    const errorResponse: ErrorResponse = {
      error: {
        message: "Invalid serenade booking ID format",
        code: ERROR_CODES.VALIDATION,
      },
    };
    return c.json(errorResponse, 400);
  }

  try {
    const result = await db
      .delete(serenadeBookings)
      .where(eq(serenadeBookings.id, id))
      .returning();

    if (result.length === 0) {
      const errorResponse: ErrorResponse = {
        error: {
          message: "Serenade booking not found",
          code: ERROR_CODES.NOT_FOUND,
        },
      };
      return c.json(errorResponse, 404);
    }

    return c.json(result[0], 200);
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
};
