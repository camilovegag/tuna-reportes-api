import { eq } from "drizzle-orm";
import { sign } from "hono/jwt";
import { ERROR_CODES } from "../constants/error-codes";
import { db, dbSchema } from "../db";
import type {
  AuthLoginPostResponse,
  AuthRegisterPostResponse,
} from "../types/auth";
import type { ServiceResult } from "../types/service";

export type RegisterInput = {
  email: string;
  password: string;
  vinculationCode: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export async function registerUser(
  data: RegisterInput,
): Promise<ServiceResult<AuthRegisterPostResponse>> {
  try {
    // Check if member exists with the vinculation code
    const [member] = await db
      .select()
      .from(dbSchema.members)
      .where(eq(dbSchema.members.vinculationCode, data.vinculationCode));

    if (!member) {
      return {
        success: false,
        error: {
          message: "Vinculation code does not exist",
          code: ERROR_CODES.NOT_FOUND,
        },
        status: 404,
      };
    }

    // Check if member is already linked to a user
    const [existingMemberUser] = await db
      .select()
      .from(dbSchema.users)
      .where(eq(dbSchema.users.memberId, member.id));

    if (existingMemberUser) {
      return {
        success: false,
        error: {
          message: "Member is already linked to a user",
          code: ERROR_CODES.CONFLICT,
        },
        status: 409,
      };
    }

    // Check if email is already registered
    const [existingUser] = await db
      .select()
      .from(dbSchema.users)
      .where(eq(dbSchema.users.email, data.email));

    if (existingUser) {
      return {
        success: false,
        error: {
          message: "Email is already registered",
          code: ERROR_CODES.CONFLICT,
        },
        status: 409,
      };
    }

    // Hash password
    const passwordHash = await Bun.password.hash(data.password);

    // Create user
    const [user] = await db
      .insert(dbSchema.users)
      .values({
        email: data.email,
        passwordHash,
        memberId: member.id,
        provider: "local",
      })
      .returning({ id: dbSchema.users.id });

    if (!user) {
      return {
        success: false,
        error: {
          message: "Failed to create user",
          code: ERROR_CODES.INTERNAL,
        },
        status: 500,
      };
    }

    return {
      success: true,
      data: {
        id: user.id,
        message: "User created",
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

export async function loginUser(
  data: LoginInput,
): Promise<ServiceResult<AuthLoginPostResponse>> {
  try {
    // Find user by email
    const [user] = await db
      .select()
      .from(dbSchema.users)
      .where(eq(dbSchema.users.email, data.email));

    if (!user || !user.passwordHash) {
      return {
        success: false,
        error: {
          message: "Invalid credentials",
          code: ERROR_CODES.UNAUTHORIZED,
        },
        status: 401,
      };
    }

    // Verify password
    const isValidPassword = await Bun.password.verify(
      data.password,
      user.passwordHash,
    );

    if (!isValidPassword) {
      return {
        success: false,
        error: {
          message: "Invalid credentials",
          code: ERROR_CODES.UNAUTHORIZED,
        },
        status: 401,
      };
    }

    // Generate JWT token
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
    };

    const secret = process.env.JWT_SECRET!;
    const token = await sign(payload, secret);

    // Update last login
    await db
      .update(dbSchema.users)
      .set({ lastLoginAt: new Date().toISOString() })
      .where(eq(dbSchema.users.id, user.id));

    return {
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
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
