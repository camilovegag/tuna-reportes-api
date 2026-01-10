import { ERROR_CODES } from "../constants/error-codes";
import type { ErrorResponse } from "../types/error";
import type { ZodIssue } from "zod";

/**
 * Custom error handler for @hono/zod-validator to match our API error format
 *
 * This is called AUTOMATICALLY by zValidator when validation fails.
 * It transforms Zod validation errors into our standardized error response structure.
 *
 * @param result - Result from Zod validation (from zValidator middleware)
 * @param c - Hono context
 * @returns JSON error response if validation failed
 */
export const validatorErrorHandler = (result: any, c: any) => {
  if (!result.success && result.error) {
    // Format Zod errors into our custom format: { field: [errors] }
    const fieldErrors: Record<string, string[]> = {};

    if (result.error.issues) {
      result.error.issues.forEach((issue: ZodIssue) => {
        const field = issue.path.join(".") || "general";
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(issue.message);
      });
    }

    const errorResponse: ErrorResponse = {
      error: {
        message: "Validation failed",
        details: fieldErrors,
        code: ERROR_CODES.VALIDATION,
      },
    };
    return c.json(errorResponse, 400);
  }
};
