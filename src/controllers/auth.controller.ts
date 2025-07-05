import { eq } from "drizzle-orm";
import type { Context } from "hono";
import { sign } from "hono/jwt";
import { z } from "zod/v4";
import { ERROR_CODES } from "../constants/error-codes";
import { db, dbSchema } from "../db";
import {
  loginSchema,
  registerSchema,
  type AuthProvider,
} from "../schemas/auth.schema";
import type { AuthRegisterPostResponse } from "../types/auth";
import type { ErrorResponse } from "../types/error";

export async function postRegisterController(c: Context) {
  const body = await c.req.json();
  const result = registerSchema.safeParse(body);

  if (!result.success) {
    const { properties } = z.treeifyError(result.error);
    const flatErrors = Object.fromEntries(
      Object.entries(properties ?? {}).map(([key, value]) => [
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

  const [member] = await db
    .select()
    .from(dbSchema.members)
    .where(eq(dbSchema.members.vinculationCode, result.data.vinculationCode));

  if (!member) {
    const errorResponse: ErrorResponse = {
      error: {
        message: "Vinculation code does not exists",
        code: ERROR_CODES.NOT_FOUND,
      },
    };
    return c.json(errorResponse, 400);
  }

  const [existingUserByEmail] = await db
    .select()
    .from(dbSchema.users)
    .where(eq(dbSchema.users.email, result.data.email));

  if (existingUserByEmail) {
    const errorResponse: ErrorResponse = {
      error: {
        message: "Email is already registered",
        code: ERROR_CODES.VALIDATION,
      },
    };
    return c.json(errorResponse, 400);
  }

  const [existingUserByMemberId] = await db
    .select()
    .from(dbSchema.users)
    .where(eq(dbSchema.users.memberId, member.id));

  if (existingUserByMemberId) {
    const errorResponse: ErrorResponse = {
      error: {
        message: "This member is already linked to a user",
        code: ERROR_CODES.VALIDATION,
      },
    };
    return c.json(errorResponse, 400);
  }

  try {
    const passwordHash = await Bun.password.hash(result.data.password);

    const userToInsert = {
      email: result.data.email,
      passwordHash,
      provider: "local" as AuthProvider,
      memberId: member.id,
    };

    const [inserted] = await db
      .insert(dbSchema.users)
      .values(userToInsert)
      .returning({ id: dbSchema.users.id });

    if (!inserted || !inserted.id) {
      const errorResponse: ErrorResponse = {
        error: {
          message: "Failed to create user",
          code: ERROR_CODES.INTERNAL,
        },
      };
      return c.json(errorResponse, 500);
    }

    const response: AuthRegisterPostResponse = {
      id: inserted.id,
      message: "User created",
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

export async function postLoginController(c: Context) {
  const body = await c.req.json();
  const result = await loginSchema.safeParse(body);

  if (!result.success) {
    const { properties } = z.treeifyError(result.error);
    const flatErrors = Object.fromEntries(
      Object.entries(properties ?? {}).map(([key, value]) => [
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

  const [user] = await db
    .select()
    .from(dbSchema.users)
    .where(eq(dbSchema.users.email, result.data.email));

  if (user && user.passwordHash) {
    const passwordMatch = await Bun.password.verify(
      result.data.password,
      user.passwordHash,
    );

    if (passwordMatch) {
      const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + 3600 * 24, // 1 day
      };
      const token = await sign(payload, process.env.JWT_SECRET!);

      return c.json(
        {
          token,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
          },
        },
        200,
      );
    }
  }

  const errorResponse: ErrorResponse = {
    error: {
      message: "Invalid credentials",
      code: ERROR_CODES.UNAUTHORIZED,
    },
  };

  return c.json(errorResponse, 401);
}
