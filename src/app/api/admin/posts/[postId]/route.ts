import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { securityAuditService } from "@/security/audit";

interface RouteParams {
  params: Promise<{ postId: string }>;
}

export const dynamic = "force-dynamic";

/**
 * DELETE /api/admin/posts/[postId]
 * Administrative removal of a post.
 * Strictly ADMIN-only. Cascades relational data cleanly and logs an immutable audit trail.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin();

    const { postId } = await params;
    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        authorId: true,
        caption: true,
        author: {
          select: { username: true },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Delete post - relational cascades handle likes and comments
    await prisma.post.delete({
      where: { id: postId },
    });

    // Mark any pending reports for this post as ACTION_TAKEN
    await prisma.report.updateMany({
      where: {
        targetType: "POST",
        targetId: postId,
        status: "PENDING",
      },
      data: {
        status: "ACTION_TAKEN",
        reviewedAt: new Date(),
        reviewedById: admin.id,
        notes: "Post removed by administrator.",
      },
    });

    // Record administrative audit log
    await securityAuditService.logEvent({
      actorId: admin.id,
      action: "POST_MODERATED",
      metadata: {
        postId,
        authorId: post.authorId,
        authorUsername: post.author.username,
        action: "DELETED",
      },
    });

    return NextResponse.json({
      message: "Post removed successfully by administrator.",
      postId,
    });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized") || error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: error.message.includes("Unauthorized") ? 401 : 403 });
    }
    console.error("DELETE /api/admin/posts/[postId] error:", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
