import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { passwordHashingService } from "@/security/passwordHashing";
import { securityAuditService } from "@/security/audit";
import { DEFAULT_SECURITY_CONFIG } from "@/security/securityConfig";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, email, password } = body || {};

    if (!username || typeof username !== "string" || username.trim() === "") {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    if (!email || typeof email !== "string" || email.trim() === "") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.trim() === "") {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(cleanUsername)) {
      return NextResponse.json(
        { error: "Username must be 3-30 characters long and contain only letters, numbers, and underscores." },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
    }

    // Validate password policy
    if (password.length < DEFAULT_SECURITY_CONFIG.minPasswordLength) {
      return NextResponse.json(
        { error: `Password must be at least ${DEFAULT_SECURITY_CONFIG.minPasswordLength} characters long.` },
        { status: 400 }
      );
    }

    // Check for existing user (username or email)
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: cleanUsername, mode: "insensitive" } },
          { email: { equals: cleanEmail, mode: "insensitive" } },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.username.toLowerCase() === cleanUsername.toLowerCase()) {
        return NextResponse.json({ error: "Username is already taken." }, { status: 409 });
      }
      return NextResponse.json({ error: "Email is already registered." }, { status: 409 });
    }

    // Hash password with Argon2id
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

    // Record Audit Log
    await securityAuditService.logEvent({
      actorId: newUser.id,
      action: "REGISTER",
      metadata: { username: newUser.username, email: newUser.email },
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
