import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

/**
 * GET /api/conversations/[conversationId]
 * Fetches conversation details and verifies participant authorization.
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await context.params;

    if (!conversationId) {
      return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
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
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Enforce participant authorization
    const isParticipant = conversation.participants.some(
      (p) => p.userId === currentUser.id
    );

    if (!isParticipant) {
      return NextResponse.json(
        { error: "Access denied. You are not a participant in this conversation." },
        { status: 403 }
      );
    }

    const otherParticipant = conversation.participants.find(
      (p) => p.userId !== currentUser.id
    )?.user;

    return NextResponse.json({
      id: conversation.id,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      otherUser: otherParticipant
        ? {
            id: otherParticipant.id,
            username: otherParticipant.username,
            displayName: otherParticipant.profile?.displayName || otherParticipant.username,
            avatarUrl: otherParticipant.profile?.avatarUrl || null,
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching conversation details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
