import type { Context } from "hono";
import { db, dbSchema } from "../db";
import type {
  MemberDeleteResponse,
  MemberPatchResponse,
  MemberPostResponse,
  MembersGetResponse,
} from "../types/member";
import type { ErrorResponse } from "../types/error";
import { ERROR_CODES } from "../constants/error-codes";
import { eq } from "drizzle-orm";
import {
  memberInsertSchema,
  memberUpdateSchema,
} from "../schemas/members.schema";
import { z } from "zod/v4";

export async function getMembersController(c: Context) {
  try {
    const members = await db.select().from(dbSchema.members);
    const response: MembersGetResponse = {
      members,
      count: members.length,
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
}

export async function getMemberController(c: Context) {
  const id = c.req.param("id");

  const [member] = await db
    .select()
    .from(dbSchema.members)
    .where(eq(dbSchema.members.id, id));

  if (!member) {
    const errorResponse: ErrorResponse = {
      error: {
        message: "Member not found",
        code: ERROR_CODES.NOT_FOUND,
      },
    };
    return c.json(errorResponse, 404);
  }
  return c.json(member, 200);
}

export async function postMemberController(c: Context) {
  const body = await c.req.json();
  const result = memberInsertSchema.safeParse(body);

  if (!result.success) {
    const tree = z.treeifyError(result.error);

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

  try {
    const [inserted] = await db
      .insert(dbSchema.members)
      .values(result.data)
      .returning({ id: dbSchema.members.id });

    if (!inserted || !inserted.id) {
      const errorResponse: ErrorResponse = {
        error: {
          message: "Failed to create member",
          code: ERROR_CODES.INTERNAL,
        },
      };
      return c.json(errorResponse, 500);
    }

    const response: MemberPostResponse = {
      id: inserted.id,
      message: "Member created",
    };
    return c.json(response, 201);
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
}

export async function patchMemberController(c: Context) {
  const id = c.req.param("id");
  const body = await c.req.json();
  const result = memberUpdateSchema.safeParse(body);

  if (!result.success) {
    const tree = z.treeifyError(result.error);
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

  try {
    const [updated] = await db
      .update(dbSchema.members)
      .set(result.data)
      .where(eq(dbSchema.members.id, id))
      .returning();

    if (!updated) {
      const errorResponse: ErrorResponse = {
        error: {
          message: "Member not found",
          code: ERROR_CODES.NOT_FOUND,
        },
      };
      return c.json(errorResponse, 404);
    }

    const response: MemberPatchResponse = {
      id: updated.id,
      message: "Member updated",
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
}
export async function deleteMemberController(c: Context) {
  const id = c.req.param("id");

  try {
    const [updated] = await db
      .update(dbSchema.members)
      .set({ isActive: false })
      .where(eq(dbSchema.members.id, id))
      .returning();

    if (!updated) {
      const errorResponse: ErrorResponse = {
        error: {
          message: "Member not found",
          code: ERROR_CODES.NOT_FOUND,
        },
      };
      return c.json(errorResponse, 404);
    }

    const response: MemberDeleteResponse = {
      id: updated.id,
      message: "Member deactivated",
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
}
