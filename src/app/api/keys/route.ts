import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

/**
 * GET /api/keys
 * Retrieves public encryption key for a given user (by userId or username).
 */
export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");
    const targetUsername = searchParams.get("username");

    if (!targetUserId && !targetUsername) {
      return NextResponse.json(
        { error: "Missing userId or username parameter" },
        { status: 400 }
      );
    }

    let targetUser;
    if (targetUserId) {
      targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, username: true },
      });
    } else if (targetUsername) {
      targetUser = await prisma.user.findUnique({
        where: { username: targetUsername },
        select: { id: true, username: true },
      });
    }

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const keyRecord = await prisma.userEncryptionKey.findUnique({
      where: { userId: targetUser.id },
      select: {
        userId: true,
        publicKey: true,
        algorithm: true,
        version: true,
        createdAt: true,
      },
    });

    if (!keyRecord) {
      return NextResponse.json(
        { error: "User has not registered an encryption key" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      userId: keyRecord.userId,
      publicKey: keyRecord.publicKey,
      algorithm: keyRecord.algorithm,
      version: keyRecord.version,
    });
  } catch (error) {
    console.error("Error fetching user public key:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/keys
 * Registers or updates the current authenticated user's public encryption key.
 */
export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { publicKey, algorithm = "ECDH-P256", version = 1 } = body;

    if (!publicKey || typeof publicKey !== "string") {
      return NextResponse.json(
        { error: "Invalid public key format" },
        { status: 400 }
      );
    }

    if (publicKey.length > 8192) {
      return NextResponse.json(
        { error: "Public key payload exceeds size limit" },
        { status: 400 }
      );
    }

    // Verify it parses as JSON (JWK)
    try {
      JSON.parse(publicKey);
    } catch {
      return NextResponse.json(
        { error: "Public key must be valid serialized JWK JSON" },
        { status: 400 }
      );
    }

    const keyRecord = await prisma.userEncryptionKey.upsert({
      where: { userId: currentUser.id },
      update: {
        publicKey,
        algorithm,
        version,
      },
      create: {
        userId: currentUser.id,
        publicKey,
        algorithm,
        version,
      },
      select: {
        id: true,
        userId: true,
        algorithm: true,
        version: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      key: keyRecord,
    });
  } catch (error) {
    console.error("Error storing user public key:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
