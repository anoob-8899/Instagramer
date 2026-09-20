import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { securityAuditService } from "@/security/audit";
import { notificationService } from "@/lib/notifications/notificationService";

const MAX_COMMENT_LENGTH = 1000;

interface RouteParams {
  params: Promise<{ postId: string }>;
}

/**
 * GET /api/posts/[postId]/comments
 * Retrieves all comments for a post ordered by creation date.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const { postId } = await params;
    if (!postId) {
      return NextResponse.json({ error: "Post ID is required" }, { status: 400 });
    }

    const comments = await prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        postId: true,
        authorId: true,
        content: true,
        createdAt: true,
        author: {
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
      },
    });

    const formattedComments = comments.map((c) => ({
      id: c.id,
      postId: c.postId,
      authorId: c.authorId,
      content: c.content,
      createdAt: c.createdAt,
      author: {
        id: c.author.id,
        username: c.author.username,
        displayName: c.author.profile?.displayName || null,
        avatarUrl: c.author.profile?.avatarUrl || null,
      },
    }));

    return NextResponse.json({ comments: formattedComments });
  } catch (error) {
    console.error("GET /api/posts/[postId]/comments error:", error);
    return NextResponse.json({ error: "Failed to retrieve comments" }, { status: 500 });
  }
}

/**
 * POST /api/posts/[postId]/comments
 * Creates a comment on the specified post by the authenticated user.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "Comment content cannot be empty" }, { status: 400 });
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length > MAX_COMMENT_LENGTH) {
      return NextResponse.json(
        { error: `Comment cannot exceed ${MAX_COMMENT_LENGTH} characters` },
        { status: 400 }
      );
    }

    const newComment = await prisma.comment.create({
      data: {
        postId,
        authorId: currentUser.id,
        content: trimmedContent,
      },
      select: {
        id: true,
        postId: true,
        authorId: true,
        content: true,
        createdAt: true,
        author: {
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
      },
    });

    await securityAuditService.logEvent({
      actorId: currentUser.id,
      action: "COMMENT_CREATED",
      metadata: { commentId: newComment.id, postId },
    });

    // Generate comment notification (self-comment prevention handled inside notificationService)
    await notificationService.createCommentNotification({
      actorId: currentUser.id,
      postId,
      commentId: newComment.id,
    });

    const formattedComment = {
      id: newComment.id,
      postId: newComment.postId,
      authorId: newComment.authorId,
      content: newComment.content,
      createdAt: newComment.createdAt,
      author: {
        id: newComment.author.id,
        username: newComment.author.username,
        displayName: newComment.author.profile?.displayName || null,
        avatarUrl: newComment.author.profile?.avatarUrl || null,
      },
    };

    return NextResponse.json({ comment: formattedComment }, { status: 201 });
  } catch (error) {
    console.error("POST /api/posts/[postId]/comments error:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
