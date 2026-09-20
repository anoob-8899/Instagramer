import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

/**
 * DELETE /api/messages/[messageId]
 * Deletes a message. Enforces sender ownership.
 */
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ messageId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messageId } = await context.params;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        senderId: true,
      },
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Sender ownership authorization check
    if (message.senderId !== currentUser.id) {
      return NextResponse.json(
        { error: "Forbidden. You can only delete your own messages." },
        { status: 403 }
      );
    }

    await prisma.message.delete({
      where: { id: messageId },
    });

    return NextResponse.json({
      success: true,
      deletedMessageId: messageId,
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
