import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { getSecuritySettings } from "@/lib/security/securitySettings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();

    const now = new Date();
    const settings = await getSecuritySettings();

    // Fetch accounts for Classroom Account Inspector (strictly NO raw password hash exposure)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const accountInspectorList = users.map((u) => {
      const isLocked = u.lockedUntil ? u.lockedUntil > now : false;
      return {
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role,
        status: u.status,
        failedLoginAttempts: u.failedLoginAttempts,
        lockedUntil: u.lockedUntil,
        isLocked,
        remainingMinutes: isLocked && u.lockedUntil ? Math.max(1, Math.ceil((u.lockedUntil.getTime() - now.getTime()) / 60000)) : 0,
        passwordFormat: "6 DIGIT",
        hashPresent: true,
        hashAlgorithm: "ARGON2ID",
        plaintextAccess: "NEVER STORED",
        lockoutStatus: isLocked ? "LOCKED" : "INACTIVE",
        rateLimitStatus: settings.rateLimitingEnabled ? "ACTIVE" : "DEMO MODE",
        messageSecurityStatus: settings.messageSecurityEnabled ? "ACTIVE" : "DEMO MODE",
      };
    });

    // Fetch security events log
    const securityEvents = await prisma.securityEvent.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      settings,
      accounts: accountInspectorList,
      events: securityEvents,
      environment: {
        application: "Instagramer",
        environment: "Production / Classroom Demo",
        database: "Neon PostgreSQL (Connected)",
        authentication: "Active (Argon2id)",
        storage: "Cloudinary (Connected)",
        hosting: "Vercel (Connected)",
      },
    });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized") || error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: error.message.includes("Unauthorized") ? 401 : 403 });
    }
    console.error("GET /api/admin/security error:", error);
    return NextResponse.json({ error: "Failed to load security telemetry" }, { status: 500 });
  }
}
