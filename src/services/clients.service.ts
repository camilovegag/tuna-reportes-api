import { desc, eq } from "drizzle-orm";
import { z } from "zod/v4";
import { ERROR_CODES } from "../constants/error-codes";
import { db } from "../db";
import { clients } from "../db/schema";
import {
  clientIdSchema,
  clientInsertSchema,
  clientUpdateSchema,
} from "../schemas/clients.schema";
import type { Client, ClientsGetResponse } from "../types/client";
import type { ServiceResult } from "../types/service";

export async function getClients(): Promise<ServiceResult<ClientsGetResponse>> {
  try {
    const result = await db
      .select()
      .from(clients)
      .orderBy(desc(clients.createdAt));

    return {
      success: true,
      data: {
        items: result,
        count: result.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message:
          error instanceof Error ? error.message : "Internal server error",
        code: ERROR_CODES.INTERNAL,
      },
      status: 500,
    };
  }
}

export async function getClientById(
  id: string,
): Promise<ServiceResult<Client>> {
  const idValidation = clientIdSchema.shape.id.safeParse(id);

  if (!idValidation.success) {
    return {
      success: false,
      error: {
        message: "Invalid client ID format",
        code: ERROR_CODES.VALIDATION,
      },
      status: 400,
    };
  }

  try {
    const result = await db.select().from(clients).where(eq(clients.id, id));
    const client = result[0];

    if (!client) {
      return {
        success: false,
        error: {
          message: "Client not found",
          code: ERROR_CODES.NOT_FOUND,
        },
        status: 404,
      };
    }

    return { success: true, data: client };
  } catch (error) {
    return {
      success: false,
      error: {
        message:
          error instanceof Error ? error.message : "Internal server error",
        code: ERROR_CODES.INTERNAL,
      },
      status: 500,
    };
  }
}

export async function createClient(
  data: unknown,
): Promise<ServiceResult<Client>> {
  const validation = clientInsertSchema.safeParse(data);

  if (!validation.success) {
    const tree = z.treeifyError(validation.error);
    const flatErrors = Object.fromEntries(
      Object.entries(tree.properties ?? {}).map(([key, value]) => [
        key,
        value.errors,
      ]),
    );

    return {
      success: false,
      error: {
        message: "Validation failed",
        details: flatErrors,
        code: ERROR_CODES.VALIDATION,
      },
      status: 400,
    };
  }

  try {
    const result = await db.insert(clients).values(validation.data).returning();

    if (!result[0]) {
      return {
        success: false,
        error: {
          message: "Failed to create client",
          code: ERROR_CODES.INTERNAL,
        },
        status: 500,
      };
    }

    return { success: true, data: result[0] };
  } catch (error) {
    return {
      success: false,
      error: {
        message:
          error instanceof Error ? error.message : "Internal server error",
        code: ERROR_CODES.INTERNAL,
      },
      status: 500,
    };
  }
}

export async function updateClient(
  id: string,
  data: unknown,
): Promise<ServiceResult<Client>> {
  const idValidation = clientIdSchema.shape.id.safeParse(id);

  if (!idValidation.success) {
    return {
      success: false,
      error: {
        message: "Invalid client ID format",
        code: ERROR_CODES.VALIDATION,
      },
      status: 400,
    };
  }

  const validation = clientUpdateSchema.safeParse(data);

  if (!validation.success) {
    const tree = z.treeifyError(validation.error);
    const flatErrors = Object.fromEntries(
      Object.entries(tree.properties ?? {}).map(([key, value]) => [
        key,
        value.errors,
      ]),
    );

    return {
      success: false,
      error: {
        message: "Validation failed",
        details: flatErrors,
        code: ERROR_CODES.VALIDATION,
      },
      status: 400,
    };
  }

  if (Object.keys(validation.data).length === 0) {
    return {
      success: false,
      error: {
        message: "No fields provided to update",
        code: ERROR_CODES.VALIDATION,
      },
      status: 400,
    };
  }

  try {
    const updateData = {
      ...validation.data,
      updatedAt: new Date().toISOString(),
    };

    const result = await db
      .update(clients)
      .set(updateData)
      .where(eq(clients.id, id))
      .returning();
    const updatedClient = result[0];

    if (!updatedClient) {
      return {
        success: false,
        error: {
          message: "Client not found",
          code: ERROR_CODES.NOT_FOUND,
        },
        status: 404,
      };
    }

    return { success: true, data: updatedClient };
  } catch (error) {
    return {
      success: false,
      error: {
        message:
          error instanceof Error ? error.message : "Internal server error",
        code: ERROR_CODES.INTERNAL,
      },
      status: 500,
    };
  }
}

export async function deleteClient(id: string): Promise<ServiceResult<Client>> {
  const idValidation = clientIdSchema.shape.id.safeParse(id);

  if (!idValidation.success) {
    return {
      success: false,
      error: {
        message: "Invalid client ID format",
        code: ERROR_CODES.VALIDATION,
      },
      status: 400,
    };
  }

  try {
    const result = await db
      .delete(clients)
      .where(eq(clients.id, id))
      .returning();
    const deletedClient = result[0];

    if (!deletedClient) {
      return {
        success: false,
        error: {
          message: "Client not found",
          code: ERROR_CODES.NOT_FOUND,
        },
        status: 404,
      };
    }

    return { success: true, data: deletedClient };
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: unknown }).code === "23503"
    ) {
      return {
        success: false,
        error: {
          message:
            "Cannot delete client because they have associated serenade bookings",
          code: ERROR_CODES.CONFLICT,
        },
        status: 409,
      };
    }

    return {
      success: false,
      error: {
        message:
          error instanceof Error ? error.message : "Internal server error",
        code: ERROR_CODES.INTERNAL,
      },
      status: 500,
    };
  }
}
