import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { securityAuditService } from "@/security/audit";

interface RouteParams {
  params: Promise<{ commentId: string }>;
}

export const dynamic = "force-dynamic";

/**
 * DELETE /api/admin/comments/[commentId]
 * Administrative removal of an offending comment.
 * Strictly ADMIN-only. Audited with COMMENT_MODERATED.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin();

    const { commentId } = await params;
    if (!commentId) {
      return NextResponse.json({ error: "Comment ID is required" }, { status: 400 });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        authorId: true,
        postId: true,
        content: true,
        author: {
          select: { username: true },
        },
      },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    // Mark any pending reports for this comment as ACTION_TAKEN
    await prisma.report.updateMany({
      where: {
        targetType: "COMMENT",
        targetId: commentId,
        status: "PENDING",
      },
      data: {
        status: "ACTION_TAKEN",
        reviewedAt: new Date(),
        reviewedById: admin.id,
        notes: "Comment removed by administrator.",
      },
    });

    await securityAuditService.logEvent({
      actorId: admin.id,
      action: "COMMENT_MODERATED",
      metadata: {
        commentId,
        postId: comment.postId,
        authorId: comment.authorId,
        authorUsername: comment.author.username,
        action: "DELETED",
      },
    });

    return NextResponse.json({
      message: "Comment removed successfully by administrator.",
      commentId,
    });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized") || error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: error.message.includes("Unauthorized") ? 401 : 403 });
    }
    console.error("DELETE /api/admin/comments/[commentId] error:", error);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
