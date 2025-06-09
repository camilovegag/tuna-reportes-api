import { eq } from "drizzle-orm";
import type { Context } from "hono";
import { z } from "zod/v4";
import { ERROR_CODES } from "../constants/error-codes";
import { db, dbSchema } from "../db";
import { registerSchema, type AuthProvider } from "../schemas/auth.schema";
import type { AuthRegisterPostResponse } from "../types/auth";
import type { ErrorResponse } from "../types/error";

export default async function postRegisterController(c: Context) {
  const body = await c.req.json();
  const result = registerSchema.safeParse(body);

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
