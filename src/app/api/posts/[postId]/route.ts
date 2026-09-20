import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { securityAuditService } from "@/security/audit";

interface RouteParams {
  params: Promise<{ postId: string }>;
}

/**
 * DELETE /api/posts/[postId]
 * Deletes a post owned by the authenticated user.
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const { postId } = await params;
    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.authorId !== currentUser.id) {
      return NextResponse.json(
        { error: "Forbidden: You are not the author of this post" },
        { status: 403 }
      );
    }

    await prisma.post.delete({
      where: { id: postId },
    });

    await securityAuditService.logEvent({
      actorId: currentUser.id,
      action: "POST_DELETED",
      metadata: { postId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/posts/[postId] error:", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
