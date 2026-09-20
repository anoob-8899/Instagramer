import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { notificationService } from "@/lib/notifications/notificationService";

interface RouteParams {
  params: Promise<{ postId: string }>;
}

/**
 * POST /api/posts/[postId]/like
 * Toggles like status for the authenticated user on the specified post.
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

    const postExists = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });

    if (!postExists) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: currentUser.id,
          postId: postId,
        },
      },
    });

    let liked = false;

    if (existingLike) {
      // Unlike: remove record (no notification generated on unlike)
      await prisma.like.delete({
        where: {
          userId_postId: {
            userId: currentUser.id,
            postId: postId,
          },
        },
      });
      liked = false;
    } else {
      // Like: create record with duplicate protection
      try {
        await prisma.like.create({
          data: {
            userId: currentUser.id,
            postId: postId,
          },
        });
        liked = true;

        // Generate like notification (self-like prevented inside notificationService)
        await notificationService.createLikeNotification({
          actorId: currentUser.id,
          postId: postId,
        });
      } catch (err: unknown) {
        // In case of race condition / unique constraint violation
        liked = true;
      }
    }

    const likeCount = await prisma.like.count({
      where: { postId: postId },
    });

    return NextResponse.json({ liked, likeCount });
  } catch (error) {
    console.error("POST /api/posts/[postId]/like error:", error);
    return NextResponse.json({ error: "Failed to update like status" }, { status: 500 });
  }
}
