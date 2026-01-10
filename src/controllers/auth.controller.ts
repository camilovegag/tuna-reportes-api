import { eq } from "drizzle-orm";
import type { Context } from "hono";
import { sign } from "hono/jwt";
import { ERROR_CODES } from "../constants/error-codes";
import { db, dbSchema } from "../db";
import { loginSchema, registerSchema } from "../schemas/auth.schema";
import type { ErrorResponse } from "../types/error";
import type {
  AuthLoginPostResponse,
  AuthRegisterPostResponse,
} from "../types/auth";

export async function registerHandler(c: Context) {
  // Parse to ensure proper typing and field filtering
  const body = await c.req.json();
  // Data is already validated by zValidator in router
  const data = registerSchema.parse(body);

  try {
    // Check if member exists with the vinculation code
    const [member] = await db
      .select()
      .from(dbSchema.members)
      .where(eq(dbSchema.members.vinculationCode, data.vinculationCode));

    if (!member) {
      const errorResponse: ErrorResponse = {
        error: {
          message: "Vinculation code does not exist",
          code: ERROR_CODES.NOT_FOUND,
        },
      };
      return c.json(errorResponse, 400);
    }

    // Check if member is already linked to a user
    const [existingMemberUser] = await db
      .select()
      .from(dbSchema.users)
      .where(eq(dbSchema.users.memberId, member.id));

    if (existingMemberUser) {
      const errorResponse: ErrorResponse = {
        error: {
          message: "Member is already linked to a user",
          code: ERROR_CODES.CONFLICT,
        },
      };
      return c.json(errorResponse, 400);
    }

    // Check if email is already registered
    const [existingUser] = await db
      .select()
      .from(dbSchema.users)
      .where(eq(dbSchema.users.email, data.email));

    if (existingUser) {
      const errorResponse: ErrorResponse = {
        error: {
          message: "Email is already registered",
          code: ERROR_CODES.CONFLICT,
        },
      };
      return c.json(errorResponse, 400);
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
      const errorResponse: ErrorResponse = {
        error: {
          message: "Failed to create user",
          code: ERROR_CODES.INTERNAL,
        },
      };
      return c.json(errorResponse, 500);
    }

    const response: AuthRegisterPostResponse = {
      id: user.id,
      message: "User created",
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

export async function loginHandler(c: Context) {
  // Data is already validated by zValidator in router
  const body = await c.req.json();
  const data = loginSchema.parse(body);

  try {
    // Find user by email
    const [user] = await db
      .select()
      .from(dbSchema.users)
      .where(eq(dbSchema.users.email, data.email));

    if (!user || !user.passwordHash) {
      const errorResponse: ErrorResponse = {
        error: {
          message: "Invalid credentials",
          code: ERROR_CODES.UNAUTHORIZED,
        },
      };
      return c.json(errorResponse, 401);
    }

    // Verify password
    const isValidPassword = await Bun.password.verify(
      data.password,
      user.passwordHash,
    );

    if (!isValidPassword) {
      const errorResponse: ErrorResponse = {
        error: {
          message: "Invalid credentials",
          code: ERROR_CODES.UNAUTHORIZED,
        },
      };
      return c.json(errorResponse, 401);
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

    const response: AuthLoginPostResponse = {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
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
