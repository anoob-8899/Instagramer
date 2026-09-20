import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { notificationService } from "@/lib/notifications/notificationService";

/**
 * PATCH /api/notifications/read-all
 * Marks all unread notifications for the authenticated user as read.
 */
export async function PATCH() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const result = await notificationService.markAllAsRead(currentUser.id);

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
    });
  } catch (error) {
    console.error("PATCH /api/notifications/read-all error:", error);
    return NextResponse.json(
      { error: "Failed to mark all notifications as read" },
      { status: 500 }
    );
  }
}
