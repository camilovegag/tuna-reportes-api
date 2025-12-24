import { eq, desc } from "drizzle-orm";
import type { Context } from "hono";
import { z } from "zod";
import { db } from "../db";
import { clients } from "../db/schema";
import {
  clientInsertSchema,
  clientUpdateSchema,
  clientIdSchema,
} from "../schemas/clients.schema";
import type { ApiResponse } from "../types/common";
import type { Client, ClientsGetResponse } from "../types/client";

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

    return c.json<ApiResponse<ClientsGetResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error(error);
    return c.json<ApiResponse<null>>(
      {
        success: false,
        error: "Failed to fetch clients",
      },
      500,
    );
  }
};

export const getClientById = async (c: Context): Promise<Response> => {
  const id = c.req.param("id");
  const idValidation = clientIdSchema.shape.id.safeParse(id);

  if (!idValidation.success) {
    return c.json<ApiResponse<null>>(
      {
        success: false,
        error: "Invalid client ID format",
      },
      400,
    );
  }

  try {
    const result = await db.select().from(clients).where(eq(clients.id, id));

    if (result.length === 0) {
      return c.json<ApiResponse<null>>(
        {
          success: false,
          error: "Client not found",
        },
        404,
      );
    }

    return c.json<ApiResponse<Client>>({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error(error);
    return c.json<ApiResponse<null>>(
      {
        success: false,
        error: "Failed to fetch client",
      },
      500,
    );
  }
};

export const createClient = async (c: Context): Promise<Response> => {
  try {
    const body = await c.req.json();
    const validation = clientInsertSchema.safeParse(body);

    if (!validation.success) {
      return c.json<ApiResponse<null>>(
        {
          success: false,
          error:
            "Validation failed: " + JSON.stringify(validation.error.flatten()),
        },
        400,
      );
    }

    // Type assertion needed because optional().or(literal("")) creates a Union which Drizzle insert type might not perfectly infer as compatible with 'string | null | undefined'
    const result = await db
      .insert(clients)
      .values(validation.data as any)
      .returning();

    return c.json<ApiResponse<Client>>(
      {
        success: true,
        data: result[0],
      },
      201,
    );
  } catch (error) {
    console.error(error);
    return c.json<ApiResponse<null>>(
      {
        success: false,
        error: "Failed to create client",
      },
      500,
    );
  }
};

export const updateClient = async (c: Context): Promise<Response> => {
  const id = c.req.param("id");
  const idValidation = clientIdSchema.shape.id.safeParse(id);

  if (!idValidation.success) {
    return c.json<ApiResponse<null>>(
      {
        success: false,
        error: "Invalid client ID format",
      },
      400,
    );
  }

  try {
    const body = await c.req.json();
    const validation = clientUpdateSchema.safeParse(body);

    if (!validation.success) {
      return c.json<ApiResponse<null>>(
        {
          success: false,
          error:
            "Validation failed: " + JSON.stringify(validation.error.flatten()),
        },
        400,
      );
    }

    const result = await db
      .update(clients)
      .set({ ...validation.data, updatedAt: new Date().toISOString() } as any)
      .where(eq(clients.id, id))
      .returning();

    if (result.length === 0) {
      return c.json<ApiResponse<null>>(
        {
          success: false,
          error: "Client not found",
        },
        404,
      );
    }

    return c.json<ApiResponse<Client>>({
      success: true,
      data: result[0],
    });
  } catch (error) {
    console.error(error);
    return c.json<ApiResponse<null>>(
      {
        success: false,
        error: "Failed to update client",
      },
      500,
    );
  }
};

export const deleteClient = async (c: Context): Promise<Response> => {
  const id = c.req.param("id");
  const idValidation = clientIdSchema.shape.id.safeParse(id);

  if (!idValidation.success) {
    return c.json<ApiResponse<null>>(
      {
        success: false,
        error: "Invalid client ID format",
      },
      400,
    );
  }

  try {
    const result = await db
      .delete(clients)
      .where(eq(clients.id, id))
      .returning();

    if (result.length === 0) {
      return c.json<ApiResponse<null>>(
        {
          success: false,
          error: "Client not found",
        },
        404,
      );
    }

    return c.json<ApiResponse<Client>>({
      success: true,
      data: result[0],
    });
  } catch (error: any) {
    if (error.code === "23503") {
      // Foreign key violation
      return c.json<ApiResponse<null>>(
        {
          success: false,
          error:
            "Cannot delete client because they have associated serenade bookings.",
        },
        409,
      );
    }
    console.error(error);
    return c.json<ApiResponse<null>>(
      {
        success: false,
        error: "Failed to delete client",
      },
      500,
    );
  }
};
