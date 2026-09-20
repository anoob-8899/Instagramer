import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";

/**
 * GET /api/conversations
 * Returns all conversations for the authenticated user.
 */
export async function GET() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: currentUser.id,
          },
        },
      },
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
        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            id: true,
            senderId: true,
            ciphertext: true,
            encryptionVersion: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const formatted = conversations.map((conv) => {
      const otherParticipant = conv.participants.find(
        (p) => p.userId !== currentUser.id
      )?.user;

      const lastMessage = conv.messages[0] || null;

      return {
        id: conv.id,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        otherUser: otherParticipant
          ? {
              id: otherParticipant.id,
              username: otherParticipant.username,
              displayName: otherParticipant.profile?.displayName || otherParticipant.username,
              avatarUrl: otherParticipant.profile?.avatarUrl || null,
            }
          : null,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              senderId: lastMessage.senderId,
              isOwnMessage: lastMessage.senderId === currentUser.id,
              ciphertext: lastMessage.ciphertext,
              encryptionVersion: lastMessage.encryptionVersion,
              createdAt: lastMessage.createdAt,
            }
          : null,
      };
    });

    return NextResponse.json({ conversations: formatted });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/conversations
 * Finds or creates a direct conversation with a target user.
 */
export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { targetUsername, targetUserId } = body;

    if (!targetUsername && !targetUserId) {
      return NextResponse.json(
        { error: "Target username or userId is required" },
        { status: 400 }
      );
    }

    let targetUser;
    if (targetUserId) {
      targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: {
          id: true,
          username: true,
          profile: { select: { displayName: true, avatarUrl: true } },
        },
      });
    } else if (targetUsername) {
      targetUser = await prisma.user.findUnique({
        where: { username: targetUsername },
        select: {
          id: true,
          username: true,
          profile: { select: { displayName: true, avatarUrl: true } },
        },
      });
    }

    if (!targetUser) {
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 }
      );
    }

    // Prevent self-conversations
    if (targetUser.id === currentUser.id) {
      return NextResponse.json(
        { error: "Cannot start a conversation with yourself" },
        { status: 400 }
      );
    }

    // Check if an existing direct conversation already exists between the two users
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          {
            participants: {
              some: { userId: currentUser.id },
            },
          },
          {
            participants: {
              some: { userId: targetUser.id },
            },
          },
        ],
      },
      select: {
        id: true,
      },
    });

    if (existingConversation) {
      return NextResponse.json({
        conversationId: existingConversation.id,
        isNew: false,
        otherUser: {
          id: targetUser.id,
          username: targetUser.username,
          displayName: targetUser.profile?.displayName || targetUser.username,
          avatarUrl: targetUser.profile?.avatarUrl || null,
        },
      });
    }

    // Create a new direct conversation transactionally
    const newConversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [
            { userId: currentUser.id },
            { userId: targetUser.id },
          ],
        },
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({
      conversationId: newConversation.id,
      isNew: true,
      otherUser: {
        id: targetUser.id,
        username: targetUser.username,
        displayName: targetUser.profile?.displayName || targetUser.username,
        avatarUrl: targetUser.profile?.avatarUrl || null,
      },
    });
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
