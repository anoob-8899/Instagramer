import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/audit-logs
 * Paginated and filterable immutable security audit log viewer.
 * Strictly ADMIN-only. Excludes any sensitive secrets or raw private keys.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
    const action = searchParams.get("action")?.trim();
    const actor = searchParams.get("actor")?.trim();
    const search = searchParams.get("search")?.trim();

    const where: any = {};

    if (action && action !== "ALL") {
      where.action = action;
    }

    if (actor) {
      // Find matching user id if actor is a username
      const matchedUsers = await prisma.user.findMany({
        where: { username: { contains: actor, mode: "insensitive" } },
        select: { id: true },
      });
      const actorIds = matchedUsers.map((u) => u.id);
      if (actorIds.length > 0) {
        where.OR = [
          { actorId: { in: actorIds } },
          { actorId: { contains: actor, mode: "insensitive" } },
        ];
      } else {
        where.actorId = { contains: actor, mode: "insensitive" };
      }
    }

    if (search) {
      where.OR = [
        { action: { contains: search, mode: "insensitive" } },
        { metadata: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Hydrate actor usernames
    const actorIds = Array.from(new Set(logs.map((l) => l.actorId).filter(Boolean))) as string[];
    const users = await prisma.user.findMany({
      where: { id: { in: actorIds } },
      select: { id: true, username: true, role: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const formattedLogs = logs.map((log) => {
      let parsedMetadata: any = null;
      if (log.metadata) {
        try {
          parsedMetadata = JSON.parse(log.metadata);
        } catch {
          parsedMetadata = log.metadata;
        }
      }

      const actorUser = log.actorId ? userMap.get(log.actorId) : null;

      return {
        id: log.id,
        action: log.action,
        createdAt: log.createdAt,
        actorId: log.actorId,
        actorUsername: actorUser ? actorUser.username : null,
        actorRole: actorUser ? actorUser.role : null,
        metadata: parsedMetadata,
      };
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      logs: formattedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized") || error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: error.message.includes("Unauthorized") ? 401 : 403 });
    }
    console.error("GET /api/admin/audit-logs error:", error);
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}
