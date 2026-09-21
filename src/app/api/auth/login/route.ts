import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { passwordHashingService } from "@/security/passwordHashing";
import { accountLockoutService } from "@/security/accountLockout";
import { sessionSecurityService } from "@/security/sessionSecurity";
import { securityAuditService } from "@/security/audit";
import { setAuthCookie } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/security/rateLimiter";
import { getSecuritySettings } from "@/lib/security/securitySettings";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const identifier = body?.identifier || body?.username || body?.email;
    const password = body?.password;

    if (!identifier || typeof identifier !== "string" || identifier.trim() === "") {
      return NextResponse.json({ error: "Username or email is required" }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.trim() === "") {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    const cleanIdentifier = identifier.trim();

    // 1. Rate Limiting Check
    const rateLimit = await checkRateLimit(cleanIdentifier, "LOGIN");
    if (!rateLimit.allowed) {
      await prisma.securityEvent.create({
        data: {
          eventType: "RATE_LIMIT_TRIGGERED",
          username: cleanIdentifier,
          success: false,
          metadata: JSON.stringify({ resetInSeconds: rateLimit.resetInSeconds }),
        },
      });

      return NextResponse.json(
        { error: `Too many login attempts. Please try again in ${rateLimit.resetInSeconds} seconds.` },
        { status: 429 }
      );
    }

    // 2. Fetch Security Settings & Check Lockout Status if Enabled
    const settings = await getSecuritySettings();

    if (settings.accountLockoutEnabled) {
      const lockoutStatus = await accountLockoutService.checkStatus(cleanIdentifier);
      if (lockoutStatus.isLocked) {
        const minutesRemaining = lockoutStatus.lockedUntil
          ? Math.ceil((lockoutStatus.lockedUntil.getTime() - Date.now()) / 60000)
          : 15;

        await securityAuditService.logEvent({
          action: "ACCOUNT_LOCKED",
          metadata: { identifier: cleanIdentifier, remainingMinutes: minutesRemaining },
        });

        await prisma.securityEvent.create({
          data: {
            eventType: "ACCOUNT_LOCKED",
            username: cleanIdentifier,
            success: false,
            metadata: JSON.stringify({ remainingMinutes: minutesRemaining }),
          },
        });

        return NextResponse.json(
          { error: `Account is temporarily locked due to repeated failed login attempts. Try again in ${minutesRemaining} minutes.` },
          { status: 429 }
        );
      }
    }

    // Record LOGIN_ATTEMPT Security Event
    await prisma.securityEvent.create({
      data: {
        eventType: "LOGIN_ATTEMPT",
        username: cleanIdentifier,
        success: true,
      },
    });

    // 3. Lookup user by username or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: cleanIdentifier, mode: "insensitive" } },
          { email: { equals: cleanIdentifier.toLowerCase(), mode: "insensitive" } },
        ],
      },
      include: {
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

    const genericAuthError = "Invalid username or password.";

    if (!user) {
      if (settings.accountLockoutEnabled) {
        await accountLockoutService.recordFailedAttempt(cleanIdentifier);
      }
      await securityAuditService.logEvent({
        action: "LOGIN_FAILURE",
        metadata: { identifier: cleanIdentifier, reason: "User not found" },
      });

      await prisma.securityEvent.create({
        data: {
          eventType: "LOGIN_FAILURE",
          username: cleanIdentifier,
          success: false,
          metadata: JSON.stringify({ reason: "USER_NOT_FOUND" }),
        },
      });

      return NextResponse.json({ error: genericAuthError }, { status: 401 });
    }

    // 4. Verify password with Argon2id
    const isPasswordValid = await passwordHashingService.verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      let isNowLocked = false;
      if (settings.accountLockoutEnabled) {
        const updatedLockout = await accountLockoutService.recordFailedAttempt(cleanIdentifier);
        isNowLocked = updatedLockout.isLocked;
      }

      await securityAuditService.logEvent({
        actorId: user.id,
        action: "LOGIN_FAILURE",
        metadata: { identifier: cleanIdentifier, reason: "Invalid password" },
      });

      await prisma.securityEvent.create({
        data: {
          eventType: "LOGIN_FAILURE",
          username: user.username,
          userId: user.id,
          success: false,
          metadata: JSON.stringify({ reason: "INVALID_PASSWORD" }),
        },
      });

      if (isNowLocked) {
        return NextResponse.json(
          { error: "Account locked due to maximum failed login attempts. Try again in 15 minutes." },
          { status: 429 }
        );
      }

      return NextResponse.json({ error: genericAuthError }, { status: 401 });
    }

    // Check account status
    if (user.status === "SUSPENDED") {
      await securityAuditService.logEvent({
        actorId: user.id,
        action: "LOGIN_BLOCKED_SUSPENDED",
        metadata: { identifier: cleanIdentifier },
      });

      return NextResponse.json(
        { error: "This account has been suspended. Please contact platform support." },
        { status: 403 }
      );
    }

    // Reset failed attempts on success
    if (settings.accountLockoutEnabled) {
      await accountLockoutService.resetAttempts(cleanIdentifier);
    }

    // Create session
    const { rawToken, expiresAt } = await sessionSecurityService.createSession(user.id);

    // Audit logs & SecurityEvents
    await securityAuditService.logEvent({
      actorId: user.id,
      action: "LOGIN_SUCCESS",
      metadata: { username: user.username },
    });

    await prisma.securityEvent.create({
      data: {
        eventType: "LOGIN_SUCCESS",
        username: user.username,
        userId: user.id,
        success: true,
      },
    });

    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      profile: user.profile,
    };

    const response = NextResponse.json({
      message: "Login successful.",
      user: safeUser,
    });

    setAuthCookie(response, rawToken, expiresAt);

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "An unexpected server error occurred during login." }, { status: 500 });
  }
}
