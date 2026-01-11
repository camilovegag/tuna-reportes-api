import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { ErrorResponse } from "./error";

export type ServiceResult<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: ErrorResponse["error"];
      status: ContentfulStatusCode;
    };
