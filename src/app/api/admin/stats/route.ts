import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/stats
 * Provides real-time platform statistics for the Admin Dashboard.
 * Strictly ADMIN-only. Excludes any private message content, encryption keys, or credentials.
 */
export async function GET() {
  try {
    await requireAdmin();

    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      adminUsers,
      moderatorUsers,
      totalPosts,
      totalComments,
      totalLikes,
      totalFollows,
      totalConversations,
      totalMessages,
      pendingReports,
      totalReports,
      recentAuditCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.user.count({ where: { status: "SUSPENDED" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.user.count({ where: { role: "MODERATOR" } }),
      prisma.post.count(),
      prisma.comment.count(),
      prisma.like.count(),
      prisma.follow.count(),
      prisma.conversation.count(),
      prisma.message.count(),
      prisma.report.count({ where: { status: "PENDING" } }),
      prisma.report.count(),
      prisma.auditLog.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // past 24 hours
          },
        },
      }),
    ]);

    // Recent 5 audit events for dashboard preview
    const recentAuditEvents = await prisma.auditLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      metrics: {
        users: {
          total: totalUsers,
          active: activeUsers,
          suspended: suspendedUsers,
          admins: adminUsers,
          moderators: moderatorUsers,
        },
        content: {
          posts: totalPosts,
          comments: totalComments,
          likes: totalLikes,
          follows: totalFollows,
        },
        messaging: {
          conversations: totalConversations,
          messages: totalMessages,
        },
        moderation: {
          pendingReports,
          totalReports,
        },
        security: {
          recent24hAuditCount: recentAuditCount,
        },
      },
      recentAuditEvents,
    });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized") || error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: error.message.includes("Unauthorized") ? 401 : 403 });
    }
    console.error("GET /api/admin/stats error:", error);
    return NextResponse.json({ error: "Failed to load dashboard statistics" }, { status: 500 });
  }
}
