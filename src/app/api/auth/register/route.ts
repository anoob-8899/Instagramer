import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { passwordHashingService } from "@/security/passwordHashing";
import { securityAuditService } from "@/security/audit";
import { checkRateLimit } from "@/lib/security/rateLimiter";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, email, password, confirmPassword } = body || {};

    if (!username || typeof username !== "string" || username.trim() === "") {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    const cleanUsername = username.trim();

    // Check rate limiting
    const rateLimit = await checkRateLimit(cleanUsername, "REGISTER");
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many registration attempts. Please try again in ${rateLimit.resetInSeconds} seconds.` },
        { status: 429 }
      );
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(cleanUsername)) {
      return NextResponse.json(
        { error: "Username must be 3-30 characters long and contain only letters, numbers, and underscores." },
        { status: 400 }
      );
    }

    // Check password mismatch if confirmPassword provided
    if (confirmPassword !== undefined && password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    }

    // Validate 6-digit numeric password requirement for classroom accounts
    const sixDigitRegex = /^[0-9]{6}$/;
    if (!sixDigitRegex.test(password)) {
      return NextResponse.json(
        { error: "Password must contain exactly 6 digits." },
        { status: 400 }
      );
    }

    // Optional email validation if provided
    let cleanEmail: string | null = null;
    if (email && typeof email === "string" && email.trim() !== "") {
      cleanEmail = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
      }
    }

    // Check for existing username or email
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: cleanUsername, mode: "insensitive" as const } },
          ...(cleanEmail ? [{ email: { equals: cleanEmail, mode: "insensitive" as const } }] : []),
        ],
      },
    });

    if (existingUser) {
      if (existingUser.username.toLowerCase() === cleanUsername.toLowerCase()) {
        return NextResponse.json({ error: "Username already exists." }, { status: 409 });
      }
      return NextResponse.json({ error: "Email is already registered." }, { status: 409 });
    }

    // Hash 6-digit numeric password with Argon2id
    const passwordHash = await passwordHashingService.hashPassword(password);

    // Create User and Profile within a Prisma transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: cleanUsername,
          email: cleanEmail,
          passwordHash,
          profile: {
            create: {
              displayName: cleanUsername,
            },
          },
        },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
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
    });

    // Record Audit Log and SecurityEvent
    await securityAuditService.logEvent({
      actorId: newUser.id,
      action: "REGISTER",
      metadata: { username: newUser.username },
    });

    await prisma.securityEvent.create({
      data: {
        eventType: "LOGIN_SUCCESS",
        username: newUser.username,
        userId: newUser.id,
        success: true,
        metadata: JSON.stringify({ action: "ACCOUNT_CREATED", method: "6_DIGIT_PASSWORD" }),
      },
    });

    return NextResponse.json(
      {
        message: "Registration successful.",
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "An unexpected server error occurred during registration." }, { status: 500 });
  }
}
