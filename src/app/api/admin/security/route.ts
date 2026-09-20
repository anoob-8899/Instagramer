import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { DEFAULT_SECURITY_CONFIG } from "@/security/securityConfig";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/security
 * Returns security policies, lockout telemetry, and locked accounts.
 * Strictly ADMIN-only. Never returns secret keys or password hashes.
 */
export async function GET() {
  try {
    await requireAdmin();

    const now = new Date();

    // Find accounts that are currently locked
    const lockedUsers = await prisma.user.findMany({
      where: {
        lockedUntil: {
          gt: now,
        },
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        createdAt: true,
      },
      orderBy: {
        lockedUntil: "desc",
      },
    });

    // Recent security events (logins, lockouts, failures, suspensions)
    const recentSecurityEvents = await prisma.auditLog.findMany({
      where: {
        action: {
          in: [
            "LOGIN_SUCCESS",
            "LOGIN_FAILURE",
            "ACCOUNT_LOCKED",
            "USER_LOCKED",
            "USER_UNLOCKED",
            "USER_ROLE_CHANGED",
            "USER_SUSPENDED",
            "USER_UNSUSPENDED",
            "LOGIN_BLOCKED_SUSPENDED",
          ],
        },
      },
      take: 10,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      config: {
        maxLoginAttempts: DEFAULT_SECURITY_CONFIG.maxLoginAttempts,
        lockoutDurationMinutes: DEFAULT_SECURITY_CONFIG.lockoutDurationMinutes,
        sessionTtlHours: DEFAULT_SECURITY_CONFIG.sessionTtlHours,
        minPasswordLength: DEFAULT_SECURITY_CONFIG.minPasswordLength,
        cookieName: DEFAULT_SECURITY_CONFIG.cookieName,
      },
      modules: {
        passwordHashing: { name: "Argon2id Memory-Hard KDF", status: "Active" },
        sessionSecurity: { name: "HTTP-Only Secure Sessions (32-byte crypto tokens)", status: "Active" },
        accountLockout: { name: "Brute-force Lockout Tracker", status: "Active" },
        e2eeCryptography: { name: "ECDH P-256 / AES-256-GCM / HKDF SHA-256", status: "Active" },
        auditTrail: { name: "Immutable Security Audit Logger", status: "Active" },
      },
      telemetry: {
        currentlyLockedCount: lockedUsers.length,
        lockedUsers: lockedUsers.map((u) => ({
          id: u.id,
          username: u.username,
          email: u.email,
          role: u.role,
          failedLoginAttempts: u.failedLoginAttempts,
          lockedUntil: u.lockedUntil,
          remainingMinutes: u.lockedUntil ? Math.max(1, Math.ceil((u.lockedUntil.getTime() - now.getTime()) / 60000)) : 0,
        })),
      },
      recentSecurityEvents,
    });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized") || error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: error.message.includes("Unauthorized") ? 401 : 403 });
    }
    console.error("GET /api/admin/security error:", error);
    return NextResponse.json({ error: "Failed to load security telemetry" }, { status: 500 });
  }
}
