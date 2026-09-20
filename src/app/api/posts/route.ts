import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { securityAuditService } from "@/security/audit";

const MAX_CAPTION_LENGTH = 2200;
const MAX_MEDIA_URL_LENGTH = 2048;

function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * GET /api/posts
 * Retrieves feed posts for the authenticated user (authored by user + followed accounts).
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") || "20", 10)), 50);

    // Get list of followed user IDs
    const following = await prisma.follow.findMany({
      where: { followerId: currentUser.id },
      select: { followingId: true },
    });

    const feedAuthorIds = [currentUser.id, ...following.map((f) => f.followingId)];

    const posts = await prisma.post.findMany({
      where: {
        authorId: { in: feedAuthorIds },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      select: {
        id: true,
        caption: true,
        mediaUrl: true,
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
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
        likes: {
          where: { userId: currentUser.id },
          select: { id: true },
          take: 1,
        },
      },
    });

    const formattedPosts = posts.map((p) => ({
      id: p.id,
      imageUrl: p.mediaUrl,
      caption: p.caption || "",
      createdAt: p.createdAt,
      likesCount: p._count.likes,
      commentsCount: p._count.comments,
      isLiked: p.likes.length > 0,
      author: {
        id: p.author.id,
        username: p.author.username,
        displayName: p.author.profile?.displayName || null,
        avatarUrl: p.author.profile?.avatarUrl || null,
      },
    }));

    return NextResponse.json({ posts: formattedPosts });
  } catch (error) {
    console.error("GET /api/posts error:", error);
    return NextResponse.json({ error: "Failed to retrieve feed posts" }, { status: 500 });
  }
}

/**
 * POST /api/posts
 * Creates a new post for the authenticated user.
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { mediaUrl, caption } = body;

    if (!mediaUrl || typeof mediaUrl !== "string" || !mediaUrl.trim()) {
      return NextResponse.json({ error: "Media URL is required" }, { status: 400 });
    }

    const trimmedMediaUrl = mediaUrl.trim();
    if (trimmedMediaUrl.length > MAX_MEDIA_URL_LENGTH) {
      return NextResponse.json(
        { error: `Media URL cannot exceed ${MAX_MEDIA_URL_LENGTH} characters` },
        { status: 400 }
      );
    }

    if (!isValidUrl(trimmedMediaUrl)) {
      return NextResponse.json(
        { error: "Media URL must be a valid HTTP or HTTPS URL" },
        { status: 400 }
      );
    }

    let trimmedCaption: string | null = null;
    if (caption !== undefined && caption !== null) {
      if (typeof caption !== "string") {
        return NextResponse.json({ error: "Caption must be a string" }, { status: 400 });
      }
      trimmedCaption = caption.trim();
      if (trimmedCaption.length > MAX_CAPTION_LENGTH) {
        return NextResponse.json(
          { error: `Caption cannot exceed ${MAX_CAPTION_LENGTH} characters` },
          { status: 400 }
        );
      }
    }

    const newPost = await prisma.post.create({
      data: {
        authorId: currentUser.id,
        mediaUrl: trimmedMediaUrl,
        caption: trimmedCaption || null,
      },
      select: {
        id: true,
        caption: true,
        mediaUrl: true,
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
      action: "POST_CREATED",
      metadata: { postId: newPost.id },
    });

    const responsePost = {
      id: newPost.id,
      imageUrl: newPost.mediaUrl,
      caption: newPost.caption || "",
      createdAt: newPost.createdAt,
      likesCount: 0,
      commentsCount: 0,
      isLiked: false,
      author: {
        id: newPost.author.id,
        username: newPost.author.username,
        displayName: newPost.author.profile?.displayName || null,
        avatarUrl: newPost.author.profile?.avatarUrl || null,
      },
    };

    return NextResponse.json({ post: responsePost }, { status: 201 });
  } catch (error) {
    console.error("POST /api/posts error:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
