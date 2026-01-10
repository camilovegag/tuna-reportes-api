import { and, eq } from "drizzle-orm";
import type { Context } from "hono";
import { z } from "zod/v4";
import { ERROR_CODES } from "../constants/error-codes";
import { db, dbSchema } from "../db";
import {
  attendanceInsertSchema,
  attendanceSelectSchema,
  attendanceUpdateSchema,
} from "../schemas/attendances.schema";
import type { AuthUserPayload } from "../types/auth";
import type {
  AttendanceDeleteResponse,
  AttendancePostResponse,
  AttendancesGetResponse,
  AttendanceUpdateResponse,
} from "../types/attendance";
import type { ErrorResponse } from "../types/error";

export async function getAttendancesController(c: Context) {
  try {
    const eventId = c.req.query("eventId");
    const memberId = c.req.query("memberId");

    let query = db.select().from(dbSchema.attendances);

    // Apply filters
    if (eventId && memberId) {
      query = query.where(
        and(
          eq(dbSchema.attendances.eventId, eventId),
          eq(dbSchema.attendances.memberId, memberId),
        ),
      ) as typeof query;
    } else if (eventId) {
      query = query.where(
        eq(dbSchema.attendances.eventId, eventId),
      ) as typeof query;
    } else if (memberId) {
      query = query.where(
        eq(dbSchema.attendances.memberId, memberId),
      ) as typeof query;
    }

    const attendances = await query;
    const response: AttendancesGetResponse = {
      attendances,
      count: attendances.length,
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

export async function getAttendanceController(c: Context) {
  try {
    const id = c.req.param("id");
    const idResult = attendanceSelectSchema.shape.id.safeParse(id);

    if (!idResult.success) {
      const errorResponse: ErrorResponse = {
        error: {
          message: "Invalid attendance id format",
          code: ERROR_CODES.VALIDATION,
        },
      };
      return c.json(errorResponse, 400);
    }

    const [attendance] = await db
      .select()
      .from(dbSchema.attendances)
      .where(eq(dbSchema.attendances.id, idResult.data));

    if (!attendance) {
      const errorResponse: ErrorResponse = {
        error: {
          message: "Attendance not found",
          code: ERROR_CODES.NOT_FOUND,
        },
      };
      return c.json(errorResponse, 404);
    }

    return c.json(attendance, 200);
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

export async function createAttendanceController(c: Context) {
  try {
    const body = await c.req.json();
    const data = attendanceInsertSchema.parse(body);
    const user = c.get("user") as AuthUserPayload;

    // Check if attendance already exists for this event + member
    const [existing] = await db
      .select()
      .from(dbSchema.attendances)
      .where(
        and(
          eq(dbSchema.attendances.eventId, data.eventId),
          eq(dbSchema.attendances.memberId, data.memberId),
        ),
      );

    if (existing) {
      const errorResponse: ErrorResponse = {
        error: {
          message: "Attendance already exists for this event and member",
          code: ERROR_CODES.VALIDATION,
        },
      };
      return c.json(errorResponse, 400);
    }

    const insertData = {
      ...data,
      updatedBy: user.userId,
    };

    const [inserted] = await db
      .insert(dbSchema.attendances)
      .values(insertData)
      .returning({ id: dbSchema.attendances.id });

    if (!inserted || !inserted.id) {
      const errorResponse: ErrorResponse = {
        error: {
          message: "Failed to create attendance",
          code: ERROR_CODES.INTERNAL,
        },
      };
      return c.json(errorResponse, 500);
    }

    const response: AttendancePostResponse = {
      id: inserted.id,
      message: "Attendance created",
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

export async function updateAttendanceController(c: Context) {
  const id = c.req.param("id");
  const idResult = attendanceSelectSchema.shape.id.safeParse(id);
  // zValidator already validated, but we parse again to filter unwanted fields
  const body = await c.req.json();
  const data = attendanceUpdateSchema.parse(body);

  if (!idResult.success) {
    const errorResponse: ErrorResponse = {
      error: {
        message: "Invalid attendance id format",
        code: ERROR_CODES.VALIDATION,
      },
    };
    return c.json(errorResponse, 400);
  }

  const user = c.get("user") as AuthUserPayload;

  try {
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
      updatedBy: user.userId,
    };

    const [updated] = await db
      .update(dbSchema.attendances)
      .set(updateData)
      .where(eq(dbSchema.attendances.id, idResult.data))
      .returning();

    if (!updated) {
      const errorResponse: ErrorResponse = {
        error: {
          message: "Attendance not found",
          code: ERROR_CODES.NOT_FOUND,
        },
      };
      return c.json(errorResponse, 404);
    }

    const response: AttendanceUpdateResponse = {
      id: updated.id,
      message: "Attendance updated",
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

export async function deleteAttendanceController(c: Context) {
  const id = c.req.param("id");
  const idResult = attendanceSelectSchema.shape.id.safeParse(id);

  if (!idResult.success) {
    const errorResponse: ErrorResponse = {
      error: {
        message: "Invalid attendance id format",
        code: ERROR_CODES.VALIDATION,
      },
    };
    return c.json(errorResponse, 400);
  }

  try {
    const [deleted] = await db
      .delete(dbSchema.attendances)
      .where(eq(dbSchema.attendances.id, idResult.data))
      .returning();

    if (!deleted) {
      const errorResponse: ErrorResponse = {
        error: {
          message: "Attendance not found",
          code: ERROR_CODES.NOT_FOUND,
        },
      };
      return c.json(errorResponse, 404);
    }

    const response: AttendanceDeleteResponse = {
      id: deleted.id,
      message: "Attendance deleted",
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
