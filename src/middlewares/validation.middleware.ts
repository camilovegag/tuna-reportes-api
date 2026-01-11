import { validator } from "hono/validator";
import type * as v4 from "zod/v4";
import type { z } from "zod/v4";
import { ERROR_CODES } from "../constants/error-codes";
import type { ErrorResponse } from "../types/error";

/**
 * Custom JSON body validator that uses Zod and formats errors to match our API error format.
 *
 * This replaces @hono/zod-validator's zValidator with a custom implementation that:
 * 1. Preserves full type inference for c.req.valid("json")
 * 2. Returns errors in our standardized ErrorResponse format
 *
 * Usage:
 *   .post("/", jsonValidator(mySchema), async (c) => {
 *     const body = c.req.valid("json"); // Fully typed!
 *   })
 */
export function jsonValidator<T extends v4.ZodType>(schema: T) {
  return validator("json", async (value, c) => {
    const result = await schema.safeParseAsync(value);

    if (!result.success) {
      // Format Zod errors into our custom format: { field: [errors] }
      const fieldErrors: Record<string, string[]> = {};

      for (const issue of result.error.issues) {
        const field = issue.path.map(String).join(".") || "general";
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(issue.message);
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

    return result.data as z.infer<T>;
  });
}
