import { eq } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";
import { ERROR_CODES } from "../constants/error-codes";
import { db, dbSchema } from "../db";
import type { AuthUserPayload } from "../types/auth";
import type { ErrorResponse } from "../types/error";
import type { HonoContext } from "../types/hono-context";

export const authMiddleware = createMiddleware<HonoContext>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const errorResponse: ErrorResponse = {
      error: {
        message: "Missing or invalid Authorization header",
        code: ERROR_CODES.VALIDATION,
      },
    };
    return c.json(errorResponse, 401);
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const payload = (await verify(
      token,
      process.env.JWT_SECRET!,
    )) as AuthUserPayload;

    const [user] = await db
      .select()
      .from(dbSchema.users)
      .where(eq(dbSchema.users.id, payload.userId));

    if (!user) {
      const errorResponse: ErrorResponse = {
        error: {
          message: "User not found",
          code: ERROR_CODES.UNAUTHORIZED,
        },
      };

      return c.json(errorResponse, 401);
    }

    c.set("user", payload);
    await next();
  } catch {
    const errorResponse: ErrorResponse = {
      error: {
        message: "Invalid or expired token",
        code: ERROR_CODES.UNAUTHORIZED,
      },
    };
    return c.json(errorResponse, 401);
  }
});
