import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { securityAuditService } from "@/security/audit";
import { Role, UserStatus } from "@prisma/client";

interface RouteParams {
  params: Promise<{ userId: string }>;
}

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/users/[userId]
 * Retrieves detailed admin profile for a specific user.
 * Strictly ADMIN-only. Never exposes password hashes, session tokens, or private keys.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAdmin();

    const { userId } = await params;
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        createdAt: true,
        updatedAt: true,
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
            likes: true,
            comments: true,
            reportedReports: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const now = new Date();
    const isLocked = !!(user.lockedUntil && user.lockedUntil > now);

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        failedLoginAttempts: user.failedLoginAttempts,
        lockedUntil: user.lockedUntil,
        isLocked,
        profile: user.profile,
        stats: {
          postsCount: user._count.posts,
          followersCount: user._count.followers,
          followingCount: user._count.following,
          likesCount: user._count.likes,
          commentsCount: user._count.comments,
          reportsCount: user._count.reportedReports,
        },
      },
    });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized") || error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: error.message.includes("Unauthorized") ? 401 : 403 });
    }
    console.error("GET /api/admin/users/[userId] error:", error);
    return NextResponse.json({ error: "Failed to fetch user details" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/users/[userId]
 * Updates role or account status (suspend/unsuspend) of a user.
 * Strictly ADMIN-only. Enforces self-protection (no self-demotion, no self-suspension) and audits every change.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await requireAdmin();

    const { userId } = await params;
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const { role: newRole, status: newStatus } = body;

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, role: true, status: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updateData: { role?: Role; status?: UserStatus } = {};

    // 1. Role Change Validation & Self-Demotion Protection
    if (newRole !== undefined) {
      if (!Object.values(Role).includes(newRole)) {
        return NextResponse.json({ error: `Invalid role: ${newRole}` }, { status: 400 });
      }

      if (admin.id === targetUser.id && newRole !== Role.ADMIN) {
        return NextResponse.json(
          { error: "Administrative Self-Protection: You cannot remove your own ADMIN role." },
          { status: 400 }
        );
      }

      if (newRole !== targetUser.role) {
        updateData.role = newRole as Role;
      }
    }

    // 2. Status Change Validation & Self-Suspension Protection
    if (newStatus !== undefined) {
      if (!Object.values(UserStatus).includes(newStatus)) {
        return NextResponse.json({ error: `Invalid status: ${newStatus}` }, { status: 400 });
      }

      if (admin.id === targetUser.id && newStatus === UserStatus.SUSPENDED) {
        return NextResponse.json(
          { error: "Administrative Self-Protection: You cannot suspend your own account." },
          { status: 400 }
        );
      }

      if (newStatus !== targetUser.status) {
        updateData.status = newStatus as UserStatus;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "No changes detected", user: targetUser });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // 3. Security Audit Logging
    if (updateData.role && updateData.role !== targetUser.role) {
      await securityAuditService.logEvent({
        actorId: admin.id,
        action: "USER_ROLE_CHANGED",
        metadata: {
          targetUserId: targetUser.id,
          targetUsername: targetUser.username,
          previousRole: targetUser.role,
          newRole: updateData.role,
        },
      });
    }

    if (updateData.status && updateData.status !== targetUser.status) {
      const action = updateData.status === UserStatus.SUSPENDED ? "USER_SUSPENDED" : "USER_UNSUSPENDED";
      await securityAuditService.logEvent({
        actorId: admin.id,
        action,
        metadata: {
          targetUserId: targetUser.id,
          targetUsername: targetUser.username,
          previousStatus: targetUser.status,
          newStatus: updateData.status,
        },
      });
    }

    return NextResponse.json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized") || error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: error.message.includes("Unauthorized") ? 401 : 403 });
    }
    console.error("PATCH /api/admin/users/[userId] error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
