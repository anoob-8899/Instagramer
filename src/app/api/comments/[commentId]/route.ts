import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { securityAuditService } from "@/security/audit";

interface RouteParams {
  params: Promise<{ commentId: string }>;
}

/**
 * DELETE /api/comments/[commentId]
 * Deletes a comment owned by the authenticated user.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const { commentId } = await params;
    if (!commentId) {
      return NextResponse.json({ error: "Comment ID is required" }, { status: 400 });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, authorId: true, postId: true },
    });

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (comment.authorId !== currentUser.id) {
      return NextResponse.json(
        { error: "Forbidden: You are not the author of this comment" },
        { status: 403 }
      );
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    await securityAuditService.logEvent({
      actorId: currentUser.id,
      action: "COMMENT_DELETED",
      metadata: { commentId, postId: comment.postId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/comments/[commentId] error:", error);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
