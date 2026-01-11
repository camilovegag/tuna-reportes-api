import type { AuthUserPayload } from "./auth";

/**
 * Hono context variables available after auth middleware runs.
 * Use with createMiddleware<HonoContext> for proper typing.
 */
export type HonoContext = {
  Variables: {
    user: AuthUserPayload;
  };
};
