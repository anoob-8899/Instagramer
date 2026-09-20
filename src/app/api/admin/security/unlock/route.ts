import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { securityAuditService } from "@/security/audit";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/security/unlock
 * Administrative reset of account lockout.
 * Strictly ADMIN-only. Audited with USER_UNLOCKED.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    const body = await request.json();
    const { userId } = body;

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "User ID is required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, failedLoginAttempts: true, lockedUntil: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    await securityAuditService.logEvent({
      actorId: admin.id,
      action: "USER_UNLOCKED",
      metadata: {
        targetUserId: user.id,
        targetUsername: user.username,
        previousFailedAttempts: user.failedLoginAttempts,
      },
    });

    return NextResponse.json({
      message: `Account for @${user.username} has been unlocked.`,
      userId: user.id,
    });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized") || error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: error.message.includes("Unauthorized") ? 401 : 403 });
    }
    console.error("POST /api/admin/security/unlock error:", error);
    return NextResponse.json({ error: "Failed to unlock account." }, { status: 500 });
  }
}
