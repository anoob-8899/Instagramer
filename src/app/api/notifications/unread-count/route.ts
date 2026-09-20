import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { notificationService } from "@/lib/notifications/notificationService";

/**
 * GET /api/notifications/unread-count
 * Returns the unread notification count for the authenticated user.
 */
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    const count = await notificationService.getUnreadCount(currentUser.id);

    return NextResponse.json({ count });
  } catch (error) {
    console.error("GET /api/notifications/unread-count error:", error);
    return NextResponse.json(
      { error: "Failed to fetch unread count" },
      { status: 500 }
    );
  }
}
