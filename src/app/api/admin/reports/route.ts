import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { ReportStatus, ReportTargetType } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/reports
 * Paginated reports queue for administration and moderation review.
 * Strictly ADMIN-only. Hydrates target summary (post, comment, user).
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const statusParam = searchParams.get("status")?.toUpperCase();
    const targetTypeParam = searchParams.get("targetType")?.toUpperCase();

    const where: any = {};

    if (statusParam && Object.values(ReportStatus).includes(statusParam as ReportStatus)) {
      where.status = statusParam as ReportStatus;
    }

    if (targetTypeParam && Object.values(ReportTargetType).includes(targetTypeParam as ReportTargetType)) {
      where.targetType = targetTypeParam as ReportTargetType;
    }

    const [total, reports] = await Promise.all([
      prisma.report.count({ where }),
      prisma.report.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          reporter: {
            select: {
              id: true,
              username: true,
              profile: {
                select: {
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
          reviewedBy: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      }),
    ]);

    // Hydrate targets
    const targetPostIds = reports.filter((r) => r.targetType === "POST").map((r) => r.targetId);
    const targetCommentIds = reports.filter((r) => r.targetType === "COMMENT").map((r) => r.targetId);
    const targetUserIds = reports.filter((r) => r.targetType === "USER").map((r) => r.targetId);

    const [posts, comments, users] = await Promise.all([
      targetPostIds.length > 0
        ? prisma.post.findMany({
            where: { id: { in: targetPostIds } },
            select: {
              id: true,
              caption: true,
              mediaUrl: true,
              author: { select: { id: true, username: true } },
            },
          })
        : [],
      targetCommentIds.length > 0
        ? prisma.comment.findMany({
            where: { id: { in: targetCommentIds } },
            select: {
              id: true,
              content: true,
              postId: true,
              author: { select: { id: true, username: true } },
            },
          })
        : [],
      targetUserIds.length > 0
        ? prisma.user.findMany({
            where: { id: { in: targetUserIds } },
            select: {
              id: true,
              username: true,
              email: true,
              role: true,
              status: true,
            },
          })
        : [],
    ]);

    const postMap = new Map(posts.map((p) => [p.id, p]));
    const commentMap = new Map(comments.map((c) => [c.id, c]));
    const userMap = new Map(users.map((u) => [u.id, u]));

    const formattedReports = reports.map((r) => {
      let targetDetails: any = null;
      if (r.targetType === "POST") {
        targetDetails = postMap.get(r.targetId) || { deleted: true, id: r.targetId };
      } else if (r.targetType === "COMMENT") {
        targetDetails = commentMap.get(r.targetId) || { deleted: true, id: r.targetId };
      } else if (r.targetType === "USER") {
        targetDetails = userMap.get(r.targetId) || { deleted: true, id: r.targetId };
      }

      return {
        id: r.id,
        targetType: r.targetType,
        targetId: r.targetId,
        reason: r.reason,
        status: r.status,
        notes: r.notes,
        createdAt: r.createdAt,
        reviewedAt: r.reviewedAt,
        reporter: {
          id: r.reporter.id,
          username: r.reporter.username,
          displayName: r.reporter.profile?.displayName || r.reporter.username,
          avatarUrl: r.reporter.profile?.avatarUrl || null,
        },
        reviewedBy: r.reviewedBy
          ? {
              id: r.reviewedBy.id,
              username: r.reviewedBy.username,
            }
          : null,
        targetDetails,
      };
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      reports: formattedReports,
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
    console.error("GET /api/admin/reports error:", error);
    return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
  }
}
