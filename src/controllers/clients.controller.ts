import { eq, desc } from "drizzle-orm";
import type { Context } from "hono";
import { z } from "zod/v4";
import { db } from "../db";
import { clients } from "../db/schema";
import {
  clientInsertSchema,
  clientUpdateSchema,
  clientIdSchema,
} from "../schemas/clients.schema";
import type { ErrorResponse } from "../types/error";
import type { Client, ClientsGetResponse } from "../types/client";
import { ERROR_CODES } from "../constants/error-codes";

export const getClients = async (c: Context): Promise<Response> => {
  try {
    const result = await db
      .select()
      .from(clients)
      .orderBy(desc(clients.createdAt));
    const response: ClientsGetResponse = {
      items: result,
      count: result.length,
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
};

export const getClientById = async (c: Context): Promise<Response> => {
  const id = c.req.param("id");
  const idValidation = clientIdSchema.shape.id.safeParse(id);

  if (!idValidation.success) {
    const errorResponse: ErrorResponse = {
      error: {
        message: "Invalid client ID format",
        code: ERROR_CODES.VALIDATION,
      },
    };
    return c.json(errorResponse, 400);
  }

  try {
    const result = await db.select().from(clients).where(eq(clients.id, id));

    if (result.length === 0) {
      const errorResponse: ErrorResponse = {
        error: {
          message: "Client not found",
          code: ERROR_CODES.NOT_FOUND,
        },
      };
      return c.json(errorResponse, 404);
    }

    return c.json(result[0], 200);
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
};

export const createClient = async (c: Context): Promise<Response> => {
  try {
    const body = await c.req.json();
    const validation = clientInsertSchema.safeParse(body);

    if (!validation.success) {
      const tree = z.treeifyError(validation.error);
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

    const result = await db.insert(clients).values(validation.data).returning();

    if (!result[0]) {
      const errorResponse: ErrorResponse = {
        error: {
          message: "Failed to create client",
          code: ERROR_CODES.INTERNAL,
        },
      };
      return c.json(errorResponse, 500);
    }

    return c.json(result[0], 201);
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
};

export const updateClient = async (c: Context): Promise<Response> => {
  const id = c.req.param("id");
  const idValidation = clientIdSchema.shape.id.safeParse(id);

  if (!idValidation.success) {
    const errorResponse: ErrorResponse = {
      error: {
        message: "Invalid client ID format",
        code: ERROR_CODES.VALIDATION,
      },
    };
    return c.json(errorResponse, 400);
  }

  try {
    const body = await c.req.json();
    const validation = clientUpdateSchema.safeParse(body);

    if (!validation.success) {
      const tree = z.treeifyError(validation.error);
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

    if (Object.keys(validation.data).length === 0) {
      const errorResponse: ErrorResponse = {
        error: {
          message: "No fields provided to update",
          code: ERROR_CODES.VALIDATION,
        },
      };
      return c.json(errorResponse, 400);
    }

    const updateData = {
      ...validation.data,
      updatedAt: new Date().toISOString(),
    };

    const result = await db
      .update(clients)
      .set(updateData)
      .where(eq(clients.id, id))
      .returning();

    if (result.length === 0) {
      const errorResponse: ErrorResponse = {
        error: {
          message: "Client not found",
          code: ERROR_CODES.NOT_FOUND,
        },
      };
      return c.json(errorResponse, 404);
    }

    return c.json(result[0], 200);
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
};

export const deleteClient = async (c: Context): Promise<Response> => {
  const id = c.req.param("id");
  const idValidation = clientIdSchema.shape.id.safeParse(id);

  if (!idValidation.success) {
    const errorResponse: ErrorResponse = {
      error: {
        message: "Invalid client ID format",
        code: ERROR_CODES.VALIDATION,
      },
    };
    return c.json(errorResponse, 400);
  }

  try {
    const result = await db
      .delete(clients)
      .where(eq(clients.id, id))
      .returning();

    if (result.length === 0) {
      const errorResponse: ErrorResponse = {
        error: {
          message: "Client not found",
          code: ERROR_CODES.NOT_FOUND,
        },
      };
      return c.json(errorResponse, 404);
    }

    return c.json(result[0], 200);
  } catch (error: any) {
    if (error.code === "23503") {
      const errorResponse: ErrorResponse = {
        error: {
          message:
            "Cannot delete client because they have associated serenade bookings",
          code: ERROR_CODES.CONFLICT,
        },
      };
      return c.json(errorResponse, 409);
    }

    const errorResponse: ErrorResponse = {
      error: {
        message:
          error instanceof Error ? error.message : "Internal server error",
        code: ERROR_CODES.INTERNAL,
      },
    };
    return c.json(errorResponse, 500);
  }
};
