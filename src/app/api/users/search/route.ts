import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

/**
 * GET /api/users/search?q=...
 * Safe user search for finding conversation partners.
 * Excludes all sensitive authentication/security fields.
 */
export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";

    if (!query) {
      return NextResponse.json({ users: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: currentUser.id } }, // Exclude self
          {
            OR: [
              { username: { contains: query, mode: "insensitive" } },
              {
                profile: {
                  displayName: { contains: query, mode: "insensitive" },
                },
              },
            ],
          },
        ],
      },
      take: 10,
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
    });

    const safeUsers = users.map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.profile?.displayName || u.username,
      avatarUrl: u.profile?.avatarUrl || null,
    }));

    return NextResponse.json({ users: safeUsers });
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
