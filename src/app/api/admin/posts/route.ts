import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/posts
 * Paginated, searchable listing of posts for content moderation.
 * Strictly ADMIN-only.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const search = searchParams.get("search")?.trim() || "";
    const authorUsername = searchParams.get("author")?.trim() || "";

    const where: any = {};

    if (search) {
      where.OR = [
        { caption: { contains: search, mode: "insensitive" } },
        { author: { username: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (authorUsername) {
      where.author = { username: { equals: authorUsername, mode: "insensitive" } };
    }

    const [total, posts] = await Promise.all([
      prisma.post.count({ where }),
      prisma.post.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          caption: true,
          mediaUrl: true,
          createdAt: true,
          updatedAt: true,
          author: {
            select: {
              id: true,
              username: true,
              role: true,
              status: true,
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
        },
      }),
    ]);

    const formattedPosts = posts.map((p) => ({
      id: p.id,
      caption: p.caption,
      mediaUrl: p.mediaUrl,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      author: {
        id: p.author.id,
        username: p.author.username,
        role: p.author.role,
        status: p.author.status,
        displayName: p.author.profile?.displayName || p.author.username,
        avatarUrl: p.author.profile?.avatarUrl || null,
      },
      likesCount: p._count.likes,
      commentsCount: p._count.comments,
    }));

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      posts: formattedPosts,
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
    console.error("GET /api/admin/posts error:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}
