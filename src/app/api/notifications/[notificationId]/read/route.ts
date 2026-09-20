import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { notificationService } from "@/lib/notifications/notificationService";

interface RouteParams {
  params: Promise<{ notificationId: string }>;
}

/**
 * PATCH /api/notifications/[notificationId]/read
 * Marks a single notification as read if owned by the current user.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const { notificationId } = await params;
    if (!notificationId) {
      return NextResponse.json(
        { error: "Notification ID is required" },
        { status: 400 }
      );
    }

    const updated = await notificationService.markAsRead({
      notificationId,
      userId: currentUser.id,
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Notification not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      notification: {
        id: updated.id,
        readAt: updated.readAt,
      },
    });
  } catch (error) {
    console.error("PATCH /api/notifications/[notificationId]/read error:", error);
    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}
