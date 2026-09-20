import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { passwordHashingService } from "@/security/passwordHashing";
import { accountLockoutService } from "@/security/accountLockout";
import { sessionSecurityService } from "@/security/sessionSecurity";
import { securityAuditService } from "@/security/audit";
import { setAuthCookie } from "@/lib/auth/session";

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

    // 1. Check lockout status before proceeding
    const lockoutStatus = await accountLockoutService.checkStatus(cleanIdentifier);
    if (lockoutStatus.isLocked) {
      const minutesRemaining = lockoutStatus.lockedUntil
        ? Math.ceil((lockoutStatus.lockedUntil.getTime() - Date.now()) / 60000)
        : 15;

      await securityAuditService.logEvent({
        action: "ACCOUNT_LOCKED",
        metadata: { identifier: cleanIdentifier, remainingMinutes: minutesRemaining },
      });

      return NextResponse.json(
        { error: `Account is temporarily locked due to repeated failed login attempts. Try again in ${minutesRemaining} minutes.` },
        { status: 429 }
      );
    }

    // 2. Lookup user
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

    // Generic error message to prevent user enumeration
    const genericAuthError = "Invalid username/email or password.";

    if (!user) {
      await accountLockoutService.recordFailedAttempt(cleanIdentifier);
      await securityAuditService.logEvent({
        action: "LOGIN_FAILURE",
        metadata: { identifier: cleanIdentifier, reason: "User not found" },
      });
      return NextResponse.json({ error: genericAuthError }, { status: 401 });
    }

    // 3. Verify password
    const isPasswordValid = await passwordHashingService.verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      const updatedLockout = await accountLockoutService.recordFailedAttempt(cleanIdentifier);
      await securityAuditService.logEvent({
        actorId: user.id,
        action: "LOGIN_FAILURE",
        metadata: { identifier: cleanIdentifier, reason: "Invalid password" },
      });

      if (updatedLockout.isLocked) {
        return NextResponse.json(
          { error: "Account locked due to maximum failed login attempts. Try again in 15 minutes." },
          { status: 429 }
        );
      }

      return NextResponse.json({ error: genericAuthError }, { status: 401 });
    }

    // 3.5 Check account status
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

    // 4. Successful login: reset lockout counter
    await accountLockoutService.resetAttempts(cleanIdentifier);

    // 5. Create secure server-side session
    const { rawToken, expiresAt } = await sessionSecurityService.createSession(user.id);

    // 6. Record audit event
    await securityAuditService.logEvent({
      actorId: user.id,
      action: "LOGIN_SUCCESS",
      metadata: { username: user.username },
    });

    // 7. Prepare response and set HTTP-only cookie
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
