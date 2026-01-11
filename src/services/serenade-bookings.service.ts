import { eq, desc } from "drizzle-orm";
import { z } from "zod/v4";
import { db } from "../db";
import { serenadeBookings } from "../db/schema";
import {
  serenadeBookingInsertSchema,
  serenadeBookingUpdateSchema,
  serenadeBookingIdSchema,
} from "../schemas/serenade-bookings.schema";
import type {
  SerenadeBooking,
  SerenadeBookingsGetResponse,
} from "../types/serenade-booking";
import type { ServiceResult } from "../types/service";
import { ERROR_CODES } from "../constants/error-codes";

export async function getSerenadeBookings(): Promise<
  ServiceResult<SerenadeBookingsGetResponse>
> {
  try {
    const result = await db
      .select()
      .from(serenadeBookings)
      .orderBy(desc(serenadeBookings.createdAt));

    return {
      success: true,
      data: {
        items: result,
        count: result.length,
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

export async function getSerenadeBookingById(
  id: string,
): Promise<ServiceResult<SerenadeBooking>> {
  const idValidation = serenadeBookingIdSchema.shape.id.safeParse(id);

  if (!idValidation.success) {
    return {
      success: false,
      error: {
        message: "Invalid serenade booking ID format",
        code: ERROR_CODES.VALIDATION,
      },
      status: 400,
    };
  }

  try {
    const result = await db
      .select()
      .from(serenadeBookings)
      .where(eq(serenadeBookings.id, id));
    const booking = result[0];

    if (!booking) {
      return {
        success: false,
        error: {
          message: "Serenade booking not found",
          code: ERROR_CODES.NOT_FOUND,
        },
        status: 404,
      };
    }

    return { success: true, data: booking };
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

export async function createSerenadeBooking(
  data: unknown,
): Promise<ServiceResult<SerenadeBooking>> {
  const validation = serenadeBookingInsertSchema.safeParse(data);

  if (!validation.success) {
    const tree = z.treeifyError(validation.error);
    const flatErrors = Object.fromEntries(
      Object.entries(tree.properties ?? {}).map(([key, value]) => [
        key,
        value.errors,
      ]),
    );

    return {
      success: false,
      error: {
        message: "Validation failed",
        details: flatErrors,
        code: ERROR_CODES.VALIDATION,
      },
      status: 400,
    };
  }

  try {
    const result = await db
      .insert(serenadeBookings)
      .values(validation.data)
      .returning();
    const booking = result[0];

    if (!booking) {
      return {
        success: false,
        error: {
          message: "Failed to create serenade booking",
          code: ERROR_CODES.INTERNAL,
        },
        status: 500,
      };
    }

    return { success: true, data: booking };
  } catch (error: unknown) {
    // Foreign key constraint violation
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: unknown }).code === "23503"
    ) {
      return {
        success: false,
        error: {
          message: "Client or Event not found",
          code: ERROR_CODES.NOT_FOUND,
        },
        status: 404,
      };
    }

    // Unique constraint violation (duplicate eventId)
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: unknown }).code === "23505"
    ) {
      return {
        success: false,
        error: {
          message: "A serenade booking already exists for this event",
          code: ERROR_CODES.CONFLICT,
        },
        status: 409,
      };
    }

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

export async function updateSerenadeBooking(
  id: string,
  data: unknown,
): Promise<ServiceResult<SerenadeBooking>> {
  const idValidation = serenadeBookingIdSchema.shape.id.safeParse(id);

  if (!idValidation.success) {
    return {
      success: false,
      error: {
        message: "Invalid serenade booking ID format",
        code: ERROR_CODES.VALIDATION,
      },
      status: 400,
    };
  }

  const validation = serenadeBookingUpdateSchema.safeParse(data);

  if (!validation.success) {
    const tree = z.treeifyError(validation.error);
    const flatErrors = Object.fromEntries(
      Object.entries(tree.properties ?? {}).map(([key, value]) => [
        key,
        value.errors,
      ]),
    );

    return {
      success: false,
      error: {
        message: "Validation failed",
        details: flatErrors,
        code: ERROR_CODES.VALIDATION,
      },
      status: 400,
    };
  }

  if (Object.keys(validation.data).length === 0) {
    return {
      success: false,
      error: {
        message: "No fields provided to update",
        code: ERROR_CODES.VALIDATION,
      },
      status: 400,
    };
  }

  try {
    const updateData = {
      ...validation.data,
      updatedAt: new Date().toISOString(),
    };

    const result = await db
      .update(serenadeBookings)
      .set(updateData)
      .where(eq(serenadeBookings.id, id))
      .returning();
    const updatedBooking = result[0];

    if (!updatedBooking) {
      return {
        success: false,
        error: {
          message: "Serenade booking not found",
          code: ERROR_CODES.NOT_FOUND,
        },
        status: 404,
      };
    }

    return { success: true, data: updatedBooking };
  } catch (error: unknown) {
    // Unique constraint violation when updating eventId
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: unknown }).code === "23505"
    ) {
      return {
        success: false,
        error: {
          message: "A serenade booking already exists for this event",
          code: ERROR_CODES.CONFLICT,
        },
        status: 409,
      };
    }

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

export async function deleteSerenadeBooking(
  id: string,
): Promise<ServiceResult<SerenadeBooking>> {
  const idValidation = serenadeBookingIdSchema.shape.id.safeParse(id);

  if (!idValidation.success) {
    return {
      success: false,
      error: {
        message: "Invalid serenade booking ID format",
        code: ERROR_CODES.VALIDATION,
      },
      status: 400,
    };
  }

  try {
    const result = await db
      .delete(serenadeBookings)
      .where(eq(serenadeBookings.id, id))
      .returning();
    const deletedBooking = result[0];

    if (!deletedBooking) {
      return {
        success: false,
        error: {
          message: "Serenade booking not found",
          code: ERROR_CODES.NOT_FOUND,
        },
        status: 404,
      };
    }

    return { success: true, data: deletedBooking };
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
