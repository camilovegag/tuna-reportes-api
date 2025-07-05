import type { Context, Next } from "hono";
import type { ErrorResponse } from "../types/error";
import { ERROR_CODES } from "../constants/error-codes";
import { verify } from "hono/jwt";

export async function authMiddleware(c: Context, next: Next) {
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
    const payload = await verify(token, process.env.JWT_SECRET!);
    c.set("user", payload);
    await next();
  } catch (error) {
    const errorResponse: ErrorResponse = {
      error: {
        message:
          error instanceof Error ? error.message : "Invalid or expired token",
        code: ERROR_CODES.VALIDATION,
      },
    };
    return c.json(errorResponse, 401);
  }
}
