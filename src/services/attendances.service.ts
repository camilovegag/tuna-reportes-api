import { and, eq } from "drizzle-orm";
import { ERROR_CODES } from "../constants/error-codes";
import { db, dbSchema } from "../db";
import {
  attendanceInsertSchema,
  attendanceSelectSchema,
  attendanceUpdateSchema,
} from "../schemas/attendances.schema";
import type {
  Attendance,
  AttendanceDeleteResponse,
  AttendancePostResponse,
  AttendancesGetResponse,
  AttendanceUpdateResponse,
} from "../types/attendance";
import type { ServiceResult } from "../types/service";

export type AttendanceFilters = {
  eventId?: string;
  memberId?: string;
};

export async function getAttendances(
  filters: AttendanceFilters,
): Promise<ServiceResult<AttendancesGetResponse>> {
  try {
    let query = db.select().from(dbSchema.attendances);

    // Apply filters
    if (filters.eventId && filters.memberId) {
      query = query.where(
        and(
          eq(dbSchema.attendances.eventId, filters.eventId),
          eq(dbSchema.attendances.memberId, filters.memberId),
        ),
      ) as typeof query;
    } else if (filters.eventId) {
      query = query.where(
        eq(dbSchema.attendances.eventId, filters.eventId),
      ) as typeof query;
    } else if (filters.memberId) {
      query = query.where(
        eq(dbSchema.attendances.memberId, filters.memberId),
      ) as typeof query;
    }

    const attendances = await query;

    return {
      success: true,
      data: {
        attendances,
        count: attendances.length,
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

export async function getAttendanceById(
  id: string,
): Promise<ServiceResult<Attendance>> {
  const idResult = attendanceSelectSchema.shape.id.safeParse(id);

  if (!idResult.success) {
    return {
      success: false,
      error: {
        message: "Invalid attendance id format",
        code: ERROR_CODES.VALIDATION,
      },
      status: 400,
    };
  }

  try {
    const result = await db
      .select()
      .from(dbSchema.attendances)
      .where(eq(dbSchema.attendances.id, idResult.data));
    const attendance = result[0];

    if (!attendance) {
      return {
        success: false,
        error: {
          message: "Attendance not found",
          code: ERROR_CODES.NOT_FOUND,
        },
        status: 404,
      };
    }

    return { success: true, data: attendance };
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

export async function createAttendance(
  data: unknown,
  userId: string,
): Promise<ServiceResult<AttendancePostResponse>> {
  const parsed = attendanceInsertSchema.safeParse(data);

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

  try {
    // Check if attendance already exists for this event + member
    const [existing] = await db
      .select()
      .from(dbSchema.attendances)
      .where(
        and(
          eq(dbSchema.attendances.eventId, parsed.data.eventId),
          eq(dbSchema.attendances.memberId, parsed.data.memberId),
        ),
      );

    if (existing) {
      return {
        success: false,
        error: {
          message: "Attendance already exists for this event and member",
          code: ERROR_CODES.VALIDATION,
        },
        status: 400,
      };
    }

    const insertData = {
      ...parsed.data,
      updatedBy: userId,
    };

    const [inserted] = await db
      .insert(dbSchema.attendances)
      .values(insertData)
      .returning({ id: dbSchema.attendances.id });

    if (!inserted || !inserted.id) {
      return {
        success: false,
        error: {
          message: "Failed to create attendance",
          code: ERROR_CODES.INTERNAL,
        },
        status: 500,
      };
    }

    return {
      success: true,
      data: {
        id: inserted.id,
        message: "Attendance created",
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

export async function updateAttendance(
  id: string,
  data: unknown,
  userId: string,
): Promise<ServiceResult<AttendanceUpdateResponse>> {
  const idResult = attendanceSelectSchema.shape.id.safeParse(id);

  if (!idResult.success) {
    return {
      success: false,
      error: {
        message: "Invalid attendance id format",
        code: ERROR_CODES.VALIDATION,
      },
      status: 400,
    };
  }

  const parsed = attendanceUpdateSchema.safeParse(data);

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

  try {
    const updateData = {
      ...parsed.data,
      updatedAt: new Date().toISOString(),
      updatedBy: userId,
    };

    const [updated] = await db
      .update(dbSchema.attendances)
      .set(updateData)
      .where(eq(dbSchema.attendances.id, idResult.data))
      .returning();

    if (!updated) {
      return {
        success: false,
        error: {
          message: "Attendance not found",
          code: ERROR_CODES.NOT_FOUND,
        },
        status: 404,
      };
    }

    return {
      success: true,
      data: {
        id: updated.id,
        message: "Attendance updated",
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

export async function deleteAttendance(
  id: string,
): Promise<ServiceResult<AttendanceDeleteResponse>> {
  const idResult = attendanceSelectSchema.shape.id.safeParse(id);

  if (!idResult.success) {
    return {
      success: false,
      error: {
        message: "Invalid attendance id format",
        code: ERROR_CODES.VALIDATION,
      },
      status: 400,
    };
  }

  try {
    const [deleted] = await db
      .delete(dbSchema.attendances)
      .where(eq(dbSchema.attendances.id, idResult.data))
      .returning();

    if (!deleted) {
      return {
        success: false,
        error: {
          message: "Attendance not found",
          code: ERROR_CODES.NOT_FOUND,
        },
        status: 404,
      };
    }

    return {
      success: true,
      data: {
        id: deleted.id,
        message: "Attendance deleted",
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
