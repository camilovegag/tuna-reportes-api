import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import { ERROR_CODES } from "../constants/error-codes";
import { db, dbSchema } from "../db";
import { userSelectSchema, userUpdateSchema } from "../schemas/users.schema";
import type { UserPublic, UsersGetResponse } from "../types/user";
import type { ServiceResult } from "../types/service";

export async function getCurrentUser(
  userId: string,
): Promise<ServiceResult<UserPublic>> {
  try {
    const [dbUser] = await db
      .select()
      .from(dbSchema.users)
      .where(eq(dbSchema.users.id, userId));

    if (!dbUser) {
      return {
        success: false,
        error: {
          message: "User not found",
          code: ERROR_CODES.NOT_FOUND,
        },
        status: 404,
      };
    }

    // Remove sensitive fields
    const { passwordHash, providerId, ...publicUser } = dbUser;

    return { success: true, data: publicUser };
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

export async function getUsers(): Promise<ServiceResult<UsersGetResponse>> {
  try {
    const users = await db.select().from(dbSchema.users);

    // Remove sensitive fields from all users
    const publicUsers: UserPublic[] = users.map(
      ({ passwordHash, providerId, ...user }) => user,
    );

    return {
      success: true,
      data: {
        users: publicUsers,
        count: publicUsers.length,
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

export async function getUserById(
  id: string,
): Promise<ServiceResult<UserPublic>> {
  try {
    const idResult = userSelectSchema.shape.id.safeParse(id);

    if (!idResult.success) {
      return {
        success: false,
        error: {
          message: "Invalid user id format",
          code: ERROR_CODES.VALIDATION,
        },
        status: 400,
      };
    }

    const [user] = await db
      .select()
      .from(dbSchema.users)
      .where(eq(dbSchema.users.id, idResult.data));

    if (!user) {
      return {
        success: false,
        error: {
          message: "User not found",
          code: ERROR_CODES.NOT_FOUND,
        },
        status: 404,
      };
    }

    // Remove sensitive fields
    const { passwordHash, providerId, ...publicUser } = user;

    return { success: true, data: publicUser };
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

export async function updateUser(
  id: string,
  data: unknown,
): Promise<ServiceResult<{ id: string; message: string }>> {
  const idResult = userSelectSchema.shape.id.safeParse(id);

  if (!idResult.success) {
    return {
      success: false,
      error: {
        message: "Invalid user id format",
        code: ERROR_CODES.VALIDATION,
      },
      status: 400,
    };
  }

  const result = userUpdateSchema.safeParse(data);

  if (!result.success) {
    const tree = z.treeifyError(result.error);
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
    const updateData = {
      ...result.data,
      updatedAt: new Date().toISOString(),
    };

    const [updated] = await db
      .update(dbSchema.users)
      .set(updateData)
      .where(eq(dbSchema.users.id, idResult.data))
      .returning();

    if (!updated) {
      return {
        success: false,
        error: {
          message: "User not found",
          code: ERROR_CODES.NOT_FOUND,
        },
        status: 404,
      };
    }

    return {
      success: true,
      data: {
        id: updated.id,
        message: "User updated",
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
