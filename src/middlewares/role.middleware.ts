import { createMiddleware } from "hono/factory";
import type { HonoContext } from "../types/hono-context";
import type { ErrorResponse } from "../types/error";
import { ERROR_CODES } from "../constants/error-codes";

/**
 * Middleware to enforce role-based access control.
 * @param allowedRoles - Array of roles that are allowed to access the route
 * @returns Hono middleware function
 */
export function requireRole(allowedRoles: ReadonlyArray<string>) {
  return createMiddleware<HonoContext>(async (c, next) => {
    const user = c.get("user");

    if (!user) {
      const errorResponse: ErrorResponse = {
        error: {
          message: "Authentication required",
          code: ERROR_CODES.UNAUTHORIZED,
        },
      };
      return c.json(errorResponse, 401);
    }

    if (!allowedRoles.includes(user.role)) {
      const errorResponse: ErrorResponse = {
        error: {
          message: `Insufficient permissions. Required roles: ${allowedRoles.join(", ")}`,
          code: ERROR_CODES.FORBIDDEN,
        },
      };
      return c.json(errorResponse, 403);
    }

    await next();
  });
}
