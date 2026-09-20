import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { Role, UserStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { sessionSecurityService } from "@/security/sessionSecurity";
import { DEFAULT_SECURITY_CONFIG } from "@/security/securityConfig";

export interface SafeProfile {
  id: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
}

export interface SafeUser {
  id: string;
  username: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: Date;
  profile: SafeProfile | null;
}

/**
 * Retrieves the currently authenticated user from the HTTP-only cookie.
 * Excludes all sensitive fields (passwordHash, internal tokens, private encryption keys).
 */
export async function getCurrentUser(): Promise<SafeUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(DEFAULT_SECURITY_CONFIG.cookieName)?.value;

    if (!token) {
      return null;
    }

    const sessionInfo = await sessionSecurityService.validateToken(token);
    if (!sessionInfo.isValid || !sessionInfo.userId) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: sessionInfo.userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        profile: {
          select: {
            id: true,
            displayName: true,
            bio: true,
            avatarUrl: true,
          },
        },
      },
    });

    return user;
  } catch (error) {
    console.error("Error retrieving current user:", error);
    return null;
  }
}

/**
 * Enforces authentication and active account status. Throws error or returns user.
 */
export async function requireAuth(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  if (user.status === UserStatus.SUSPENDED && user.role !== Role.ADMIN) {
    throw new Error("AccountSuspended");
  }
  return user;
}

/**
 * Enforces specific role authorization.
 */
export async function requireRole(allowedRole: Role): Promise<SafeUser> {
  const user = await requireAuth();
  if (user.role !== allowedRole && user.role !== Role.ADMIN) {
    throw new Error("Forbidden");
  }
  return user;
}

/**
 * Enforces ADMIN-only authorization.
 */
export async function requireAdmin(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  if (user.role !== Role.ADMIN) {
    throw new Error("Forbidden: Admin access required");
  }
  return user;
}

/**
 * Sets the HTTP-only authentication cookie on a response.
 */
export function setAuthCookie(response: NextResponse, rawToken: string, expiresAt: Date): void {
  response.cookies.set({
    name: DEFAULT_SECURITY_CONFIG.cookieName,
    value: rawToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/**
 * Clears the HTTP-only authentication cookie on a response.
 */
export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set({
    name: DEFAULT_SECURITY_CONFIG.cookieName,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
}
