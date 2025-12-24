import { eq, desc } from "drizzle-orm";
import type { Context } from "hono";
import { db } from "../db";
import { serenadeBookings } from "../db/schema";
import {
  serenadeBookingInsertSchema,
  serenadeBookingUpdateSchema,
  serenadeBookingIdSchema,
} from "../schemas/serenade-bookings.schema";
import type { ApiResponse } from "../types/common";
import type {
  SerenadeBooking,
  SerenadeBookingsGetResponse,
} from "../types/serenade-booking";

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

    return c.json<ApiResponse<SerenadeBookingsGetResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error(error);
    return c.json<ApiResponse<null>>(
      {
        success: false,
        error: "Failed to fetch serenade bookings",
      },
      500,
    );
  }
};

export const getSerenadeBookingById = async (c: Context): Promise<Response> => {
  const id = c.req.param("id");
  const idValidation = serenadeBookingIdSchema.shape.id.safeParse(id);

  if (!idValidation.success) {
    return c.json<ApiResponse<null>>(
      {
        success: false,
        error: "Invalid serenade booking ID format",
      },
      400,
    );
  }

  try {
    const result = await db
      .select()
      .from(serenadeBookings)
      .where(eq(serenadeBookings.id, id));

    if (result.length === 0) {
      return c.json<ApiResponse<null>>(
        {
          success: false,
          error: "Serenade booking not found",
        },
        404,
      );
    }

    return c.json<ApiResponse<SerenadeBooking>>({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error(error);
    return c.json<ApiResponse<null>>(
      {
        success: false,
        error: "Failed to fetch serenade booking",
      },
      500,
    );
  }
};

export const createSerenadeBooking = async (c: Context): Promise<Response> => {
  try {
    const body = await c.req.json();
    const validation = serenadeBookingInsertSchema.safeParse(body);

    if (!validation.success) {
      return c.json<ApiResponse<null>>(
        {
          success: false,
          error:
            "Validation failed: " + JSON.stringify(validation.error.flatten()),
        },
        400,
      );
    }

    const result = await db
      .insert(serenadeBookings)
      .values(validation.data)
      .returning();

    return c.json<ApiResponse<SerenadeBooking>>(
      {
        success: true,
        data: result[0],
      },
      201,
    );
  } catch (error) {
    console.error(error);
    return c.json<ApiResponse<null>>(
      {
        success: false,
        error: "Failed to create serenade booking",
      },
      500,
    );
  }
};

export const updateSerenadeBooking = async (c: Context): Promise<Response> => {
  const id = c.req.param("id");
  const idValidation = serenadeBookingIdSchema.shape.id.safeParse(id);

  if (!idValidation.success) {
    return c.json<ApiResponse<null>>(
      {
        success: false,
        error: "Invalid serenade booking ID format",
      },
      400,
    );
  }

  try {
    const body = await c.req.json();
    const validation = serenadeBookingUpdateSchema.safeParse(body);

    if (!validation.success) {
      return c.json<ApiResponse<null>>(
        {
          success: false,
          error:
            "Validation failed: " + JSON.stringify(validation.error.flatten()),
        },
        400,
      );
    }

    const result = await db
      .update(serenadeBookings)
      .set({ ...validation.data, updatedAt: new Date().toISOString() })
      .where(eq(serenadeBookings.id, id))
      .returning();

    if (result.length === 0) {
      return c.json<ApiResponse<null>>(
        {
          success: false,
          error: "Serenade booking not found",
        },
        404,
      );
    }

    return c.json<ApiResponse<SerenadeBooking>>({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error(error);
    return c.json<ApiResponse<null>>(
      {
        success: false,
        error: "Failed to update serenade booking",
      },
      500,
    );
  }
};

export const deleteSerenadeBooking = async (c: Context): Promise<Response> => {
  const id = c.req.param("id");
  const idValidation = serenadeBookingIdSchema.shape.id.safeParse(id);

  if (!idValidation.success) {
    return c.json<ApiResponse<null>>(
      {
        success: false,
        error: "Invalid serenade booking ID format",
      },
      400,
    );
  }

  try {
    const result = await db
      .delete(serenadeBookings)
      .where(eq(serenadeBookings.id, id))
      .returning();

    if (result.length === 0) {
      return c.json<ApiResponse<null>>(
        {
          success: false,
          error: "Serenade booking not found",
        },
        404,
      );
    }

    return c.json<ApiResponse<SerenadeBooking>>({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error(error);
    return c.json<ApiResponse<null>>(
      {
        success: false,
        error: "Failed to delete serenade booking",
      },
      500,
    );
  }
};
