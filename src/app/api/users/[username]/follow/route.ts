import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { securityAuditService } from "@/security/audit";
import { notificationService } from "@/lib/notifications/notificationService";

interface RouteParams {
  params: Promise<{ username: string }>;
}

/**
 * POST /api/users/[username]/follow
 * Toggles follow/unfollow status for the authenticated user towards the specified target user.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const { username } = await params;
    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const decodedUsername = decodeURIComponent(username);

    const targetUser = await prisma.user.findFirst({
      where: {
        username: {
          equals: decodedUsername,
          mode: "insensitive",
        },
      },
      select: { id: true, username: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent self-following
    if (targetUser.id === currentUser.id) {
      return NextResponse.json(
        { error: "Cannot follow your own account" },
        { status: 400 }
      );
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: targetUser.id,
        },
      },
    });

    let following = false;

    if (existingFollow) {
      // Unfollow (no notification created on unfollow)
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: currentUser.id,
            followingId: targetUser.id,
          },
        },
      });
      following = false;

      await securityAuditService.logEvent({
        actorId: currentUser.id,
        action: "FOLLOW_REMOVED",
        metadata: { targetUserId: targetUser.id, targetUsername: targetUser.username },
      });
    } else {
      // Follow
      try {
        await prisma.follow.create({
          data: {
            followerId: currentUser.id,
            followingId: targetUser.id,
          },
        });
        following = true;

        await securityAuditService.logEvent({
          actorId: currentUser.id,
          action: "FOLLOW_CREATED",
          metadata: { targetUserId: targetUser.id, targetUsername: targetUser.username },
        });

        // Generate follow notification
        await notificationService.createFollowNotification({
          actorId: currentUser.id,
          followingId: targetUser.id,
        });
      } catch (err: unknown) {
        // Handle concurrent duplicate follow attempt
        following = true;
      }
    }

    const followerCount = await prisma.follow.count({
      where: { followingId: targetUser.id },
    });

    return NextResponse.json({ following, followerCount });
  } catch (error) {
    console.error("POST /api/users/[username]/follow error:", error);
    return NextResponse.json({ error: "Failed to update follow status" }, { status: 500 });
  }
}
