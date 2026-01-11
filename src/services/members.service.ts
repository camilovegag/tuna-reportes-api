import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import { ERROR_CODES } from "../constants/error-codes";
import { db, dbSchema } from "../db";
import {
  memberInsertSchema,
  memberUpdateSchema,
} from "../schemas/members.schema";
import type { Member } from "../types/member";
import type { ServiceResult } from "../types/service";

export type MemberBasic = {
  id: string;
  nickname: string;
  fullName: string;
};

export type MembersGetResponse = {
  members: Member[];
  count: number;
};

export async function getMembersForRegistration(): Promise<
  ServiceResult<MemberBasic[]>
> {
  try {
    const members = await db
      .select({
        id: dbSchema.members.id,
        nickname: dbSchema.members.nickname,
        fullName: dbSchema.members.fullName,
      })
      .from(dbSchema.members)
      .where(eq(dbSchema.members.isActive, true));

    return { success: true, data: members };
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

export async function getMembers(): Promise<ServiceResult<MembersGetResponse>> {
  try {
    const members = await db
      .select()
      .from(dbSchema.members)
      .where(eq(dbSchema.members.isActive, true));

    return {
      success: true,
      data: {
        members,
        count: members.length,
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

export async function getMemberById(
  id: string,
): Promise<ServiceResult<Member>> {
  try {
    const [member] = await db
      .select()
      .from(dbSchema.members)
      .where(eq(dbSchema.members.id, id));

    if (!member) {
      return {
        success: false,
        error: {
          message: "Member not found",
          code: ERROR_CODES.NOT_FOUND,
        },
        status: 404,
      };
    }

    return { success: true, data: member };
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

export async function createMember(
  data: unknown,
): Promise<ServiceResult<{ id: string; message: string }>> {
  const result = memberInsertSchema.safeParse(data);

  if (!result.success) {
    const tree = z.treeifyError(result.error);
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
    const [inserted] = await db
      .insert(dbSchema.members)
      .values(result.data)
      .returning({ id: dbSchema.members.id });

    if (!inserted || !inserted.id) {
      return {
        success: false,
        error: {
          message: "Failed to create member",
          code: ERROR_CODES.INTERNAL,
        },
        status: 500,
      };
    }

    return {
      success: true,
      data: {
        id: inserted.id,
        message: "Member created",
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

export async function updateMember(
  id: string,
  data: unknown,
): Promise<ServiceResult<{ id: string; message: string }>> {
  const result = memberUpdateSchema.safeParse(data);

  if (!result.success) {
    const tree = z.treeifyError(result.error);
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
    const [updated] = await db
      .update(dbSchema.members)
      .set(result.data)
      .where(eq(dbSchema.members.id, id))
      .returning();

    if (!updated) {
      return {
        success: false,
        error: {
          message: "Member not found",
          code: ERROR_CODES.NOT_FOUND,
        },
        status: 404,
      };
    }

    return {
      success: true,
      data: {
        id: updated.id,
        message: "Member updated",
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

export async function deactivateMember(
  id: string,
): Promise<ServiceResult<{ id: string; message: string }>> {
  try {
    const [updated] = await db
      .update(dbSchema.members)
      .set({ isActive: false })
      .where(eq(dbSchema.members.id, id))
      .returning();

    if (!updated) {
      return {
        success: false,
        error: {
          message: "Member not found",
          code: ERROR_CODES.NOT_FOUND,
        },
        status: 404,
      };
    }

    return {
      success: true,
      data: {
        id: updated.id,
        message: "Member deactivated",
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
