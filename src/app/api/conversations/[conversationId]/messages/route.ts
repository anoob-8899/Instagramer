import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { notificationService } from "@/lib/notifications/notificationService";

const MAX_CIPHERTEXT_LENGTH = 65536; // 64 KB limit to prevent payload abuse

/**
 * GET /api/conversations/[conversationId]/messages
 * Returns paginated encrypted messages for a conversation.
 * Server strictly transmits ciphertext only.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await context.params;

    // Verify participation authorization
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: currentUser.id,
        },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Access denied. You are not a participant in this conversation." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50", 10), 1), 100);

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
      },
      take: limit + 1,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
      orderBy: {
        createdAt: "desc",
      },
      include: {
        sender: {
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
    });

    let nextCursor: string | null = null;
    let items = messages;

    if (messages.length > limit) {
      const nextItem = items.pop();
      nextCursor = nextItem ? nextItem.id : null;
    }

    // Format safe response (encrypted content only)
    const formatted = items.map((msg) => ({
      id: msg.id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      isOwnMessage: msg.senderId === currentUser.id,
      ciphertext: msg.ciphertext,
      encryptionVersion: msg.encryptionVersion,
      createdAt: msg.createdAt,
      sender: {
        id: msg.sender.id,
        username: msg.sender.username,
        displayName: msg.sender.profile?.displayName || msg.sender.username,
        avatarUrl: msg.sender.profile?.avatarUrl || null,
      },
    }));

    return NextResponse.json({
      messages: formatted.reverse(), // chronologically ordered (oldest to newest for chat view)
      nextCursor,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/conversations/[conversationId]/messages
 * Stores an encrypted ciphertext message.
 * Enforces participant authorization and payload bounds.
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await context.params;

    // Verify participation authorization
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: currentUser.id,
        },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Access denied. You are not a participant in this conversation." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { ciphertext, encryptionVersion = 1 } = body;

    if (!ciphertext || typeof ciphertext !== "string") {
      return NextResponse.json(
        { error: "Encrypted ciphertext payload is required" },
        { status: 400 }
      );
    }

    if (ciphertext.length > MAX_CIPHERTEXT_LENGTH) {
      return NextResponse.json(
        { error: `Ciphertext exceeds size limit of ${MAX_CIPHERTEXT_LENGTH} bytes` },
        { status: 400 }
      );
    }

    if (encryptionVersion !== 1) {
      return NextResponse.json(
        { error: `Unsupported encryption version: ${encryptionVersion}` },
        { status: 400 }
      );
    }

    // Store ciphertext and update conversation timestamp
    const [newMessage] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId,
          senderId: currentUser.id,
          ciphertext,
          encryptionVersion,
        },
        include: {
          sender: {
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
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);

    // Send metadata-only message notification to other participants (zero plaintext/ciphertext/keys)
    try {
      const otherParticipants = await prisma.conversationParticipant.findMany({
        where: {
          conversationId,
          userId: { not: currentUser.id },
        },
        select: { userId: true },
      });

      for (const p of otherParticipants) {
        await notificationService.createMessageNotification({
          senderId: currentUser.id,
          recipientId: p.userId,
        });
      }
    } catch (notifErr) {
      console.error("Failed to dispatch message notification:", notifErr);
    }

    return NextResponse.json({
      message: {
        id: newMessage.id,
        conversationId: newMessage.conversationId,
        senderId: newMessage.senderId,
        isOwnMessage: true,
        ciphertext: newMessage.ciphertext,
        encryptionVersion: newMessage.encryptionVersion,
        createdAt: newMessage.createdAt,
        sender: {
          id: newMessage.sender.id,
          username: newMessage.sender.username,
          displayName: newMessage.sender.profile?.displayName || newMessage.sender.username,
          avatarUrl: newMessage.sender.profile?.avatarUrl || null,
        },
      },
    });
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
