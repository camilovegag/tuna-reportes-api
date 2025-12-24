import { eq } from "drizzle-orm";
import type { Context } from "hono";
import { z } from "zod/v4";
import { ERROR_CODES } from "../constants/error-codes";
import { db, dbSchema } from "../db";
import { userSelectSchema, userUpdateSchema } from "../schemas/users.schema";
import type { AuthUserPayload } from "../types/auth";
import type { ErrorResponse } from "../types/error";
import type {
  UserPublic,
  UsersGetResponse,
  UserUpdateResponse,
} from "../types/user";

export async function getMeController(c: Context) {
  try {
    const user = c.get("user") as AuthUserPayload;

    const [dbUser] = await db
      .select()
      .from(dbSchema.users)
      .where(eq(dbSchema.users.id, user.userId));

    if (!dbUser) {
      const errorResponse: ErrorResponse = {
        error: {
          message: "User not found",
          code: ERROR_CODES.NOT_FOUND,
        },
      };
      return c.json(errorResponse, 404);
    }

    // Remove sensitive fields
    const { passwordHash, providerId, ...publicUser } = dbUser;

    return c.json(publicUser, 200);
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

export async function getUsersController(c: Context) {
  try {
    const users = await db.select().from(dbSchema.users);

    // Remove sensitive fields from all users
    const publicUsers: UserPublic[] = users.map(
      ({ passwordHash, providerId, ...user }) => user,
    );

    const response: UsersGetResponse = {
      users: publicUsers,
      count: publicUsers.length,
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

export async function getUserController(c: Context) {
  try {
    const id = c.req.param("id");
    const idResult = userSelectSchema.shape.id.safeParse(id);

    if (!idResult.success) {
      const errorResponse: ErrorResponse = {
        error: {
          message: "Invalid user id format",
          code: ERROR_CODES.VALIDATION,
        },
      };
      return c.json(errorResponse, 400);
    }

    const [user] = await db
      .select()
      .from(dbSchema.users)
      .where(eq(dbSchema.users.id, idResult.data));

    if (!user) {
      const errorResponse: ErrorResponse = {
        error: {
          message: "User not found",
          code: ERROR_CODES.NOT_FOUND,
        },
      };
      return c.json(errorResponse, 404);
    }

    // Remove sensitive fields
    const { passwordHash, providerId, ...publicUser } = user;

    return c.json(publicUser, 200);
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

export async function updateUserController(c: Context) {
  const id = c.req.param("id");
  const idResult = userSelectSchema.shape.id.safeParse(id);
  const body = await c.req.json();
  const result = userUpdateSchema.safeParse(body);

  if (!idResult.success) {
    const errorResponse: ErrorResponse = {
      error: {
        message: "Invalid user id format",
        code: ERROR_CODES.VALIDATION,
      },
    };
    return c.json(errorResponse, 400);
  }

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
      const errorResponse: ErrorResponse = {
        error: {
          message: "User not found",
          code: ERROR_CODES.NOT_FOUND,
        },
      };
      return c.json(errorResponse, 404);
    }

    const response: UserUpdateResponse = {
      id: updated.id,
      message: "User updated",
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
