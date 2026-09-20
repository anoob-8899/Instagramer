import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { Role, UserStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/users
 * Returns a paginated, filterable, and searchable list of users for the admin console.
 * Strictly ADMIN-only. Safe parameterized Prisma queries prevent SQL injection.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const search = searchParams.get("search")?.trim() || "";
    const roleParam = searchParams.get("role")?.toUpperCase();
    const statusParam = searchParams.get("status")?.toUpperCase();
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";

    const where: any = {};

    // Search by username, display name, or email
    if (search) {
      where.OR = [
        { username: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { profile: { displayName: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Role filter
    if (roleParam && Object.values(Role).includes(roleParam as Role)) {
      where.role = roleParam as Role;
    }

    // Status filter
    if (statusParam && Object.values(UserStatus).includes(statusParam as UserStatus)) {
      where.status = statusParam as UserStatus;
    }

    // Sorting options
    const orderBy: any = {};
    if (sortBy === "username" || sortBy === "role" || sortBy === "status" || sortBy === "createdAt") {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.createdAt = "desc";
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          lockedUntil: true,
          failedLoginAttempts: true,
          profile: {
            select: {
              id: true,
              displayName: true,
              bio: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              posts: true,
              followers: true,
              following: true,
              reportedReports: true,
            },
          },
        },
      }),
    ]);

    const formattedUsers = users.map((u) => {
      const now = new Date();
      const isLocked = !!(u.lockedUntil && u.lockedUntil > now);
      return {
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role,
        status: u.status,
        createdAt: u.createdAt,
        isLocked,
        profile: u.profile,
        stats: {
          postsCount: u._count.posts,
          followersCount: u._count.followers,
          followingCount: u._count.following,
          reportsCount: u._count.reportedReports,
        },
      };
    });

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      users: formattedUsers,
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
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
