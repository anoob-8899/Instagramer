import { prisma } from "@/lib/db/prisma";
import { NotificationType, NotificationDTO, NotificationListResponse } from "@/types/notification";

export class NotificationService {
  /**
   * Internal helper to create or refresh notifications while avoiding duplicate unread noise.
   */
  async createNotification(params: {
    recipientId: string;
    actorId: string;
    type: NotificationType;
    postId?: string | null;
    commentId?: string | null;
  }) {
    const { recipientId, actorId, type, postId = null, commentId = null } = params;

    // Strict self-notification prevention
    if (!recipientId || !actorId || recipientId === actorId) {
      return null;
    }

    try {
      // Deduplication logic for LIKE, FOLLOW, and MESSAGE:
      // If an unread notification for the same action already exists, refresh timestamp instead of creating duplicates
      if (type === "LIKE" && postId) {
        const existingUnread = await prisma.notification.findFirst({
          where: {
            recipientId,
            actorId,
            type: "LIKE",
            postId,
            readAt: null,
          },
        });

        if (existingUnread) {
          return await prisma.notification.update({
            where: { id: existingUnread.id },
            data: { createdAt: new Date() },
          });
        }
      } else if (type === "FOLLOW") {
        const existingUnread = await prisma.notification.findFirst({
          where: {
            recipientId,
            actorId,
            type: "FOLLOW",
            readAt: null,
          },
        });

        if (existingUnread) {
          return await prisma.notification.update({
            where: { id: existingUnread.id },
            data: { createdAt: new Date() },
          });
        }
      } else if (type === "MESSAGE") {
        const existingUnread = await prisma.notification.findFirst({
          where: {
            recipientId,
            actorId,
            type: "MESSAGE",
            readAt: null,
          },
        });

        if (existingUnread) {
          return await prisma.notification.update({
            where: { id: existingUnread.id },
            data: { createdAt: new Date() },
          });
        }
      }

      return await prisma.notification.create({
        data: {
          recipientId,
          actorId,
          type,
          postId,
          commentId,
        },
      });
    } catch (error) {
      console.error("[NotificationService] Failed to create notification:", error);
      return null;
    }
  }

  /**
   * Create notification when a user likes another user's post.
   */
  async createLikeNotification(params: { actorId: string; postId: string }) {
    const { actorId, postId } = params;
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });

    if (!post || post.authorId === actorId) {
      return null;
    }

    return this.createNotification({
      recipientId: post.authorId,
      actorId,
      type: "LIKE",
      postId: post.id,
    });
  }

  /**
   * Create notification when a user comments on another user's post.
   */
  async createCommentNotification(params: {
    actorId: string;
    postId: string;
    commentId: string;
  }) {
    const { actorId, postId, commentId } = params;
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });

    if (!post || post.authorId === actorId) {
      return null;
    }

    return this.createNotification({
      recipientId: post.authorId,
      actorId,
      type: "COMMENT",
      postId: post.id,
      commentId,
    });
  }

  /**
   * Create notification when a user follows another user.
   */
  async createFollowNotification(params: { actorId: string; followingId: string }) {
    const { actorId, followingId } = params;
    if (actorId === followingId) {
      return null;
    }

    return this.createNotification({
      recipientId: followingId,
      actorId,
      type: "FOLLOW",
    });
  }

  /**
   * Create notification when a user sends a message in a conversation.
   * STRICT E2EE PRIVACY: Zero plaintext, ciphertext, or key data is ever passed or stored.
   */
  async createMessageNotification(params: { senderId: string; recipientId: string }) {
    const { senderId, recipientId } = params;
    if (senderId === recipientId) {
      return null;
    }

    return this.createNotification({
      recipientId,
      actorId: senderId,
      type: "MESSAGE",
    });
  }

  /**
   * Create system/security notification.
   */
  async createSystemNotification(params: { recipientId: string; actorId: string }) {
    const { recipientId, actorId } = params;
    return this.createNotification({
      recipientId,
      actorId,
      type: "SYSTEM",
    });
  }

  /**
   * Fetch paginated notifications for the authenticated user.
   */
  async getUserNotifications(params: {
    userId: string;
    cursor?: string | null;
    limit?: number;
  }): Promise<NotificationListResponse> {
    const { userId, cursor = null, limit = 20 } = params;
    const safeLimit = Math.min(Math.max(limit, 1), 50);

    const items = await prisma.notification.findMany({
      where: {
        recipientId: userId,
      },
      take: safeLimit + 1,
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
        actor: {
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
        post: {
          select: {
            id: true,
            caption: true,
            mediaUrl: true,
          },
        },
        comment: {
          select: {
            id: true,
            content: true,
          },
        },
      },
    });

    let nextCursor: string | null = null;
    let notificationsList = items;

    if (items.length > safeLimit) {
      const nextItem = notificationsList.pop();
      nextCursor = nextItem ? nextItem.id : null;
    }

    const formatted: NotificationDTO[] = notificationsList.map((item) => {
      let actionText = "";
      let targetUrl = "/feed";

      switch (item.type) {
        case "LIKE":
          actionText = item.post ? "liked your post." : "liked your post (content deleted).";
          targetUrl = "/feed";
          break;
        case "COMMENT":
          if (item.comment) {
            const preview =
              item.comment.content.length > 50
                ? `${item.comment.content.slice(0, 50)}...`
                : item.comment.content;
            actionText = `commented: "${preview}"`;
          } else {
            actionText = "commented on your post.";
          }
          targetUrl = "/feed";
          break;
        case "FOLLOW":
          actionText = "started following you.";
          targetUrl = `/profile/${item.actor.username}`;
          break;
        case "MESSAGE":
          actionText = "sent you a message.";
          targetUrl = "/messages";
          break;
        case "SYSTEM":
          actionText = "Account security notice.";
          targetUrl = "/settings";
          break;
        default:
          actionText = "interacted with you.";
          targetUrl = "/feed";
      }

      return {
        id: item.id,
        recipientId: item.recipientId,
        actorId: item.actorId,
        type: item.type as NotificationType,
        postId: item.postId,
        commentId: item.commentId,
        readAt: item.readAt ? item.readAt.toISOString() : null,
        createdAt: item.createdAt.toISOString(),
        actor: {
          id: item.actor.id,
          username: item.actor.username,
          displayName: item.actor.profile?.displayName || null,
          avatarUrl: item.actor.profile?.avatarUrl || null,
        },
        post: item.post
          ? {
              id: item.post.id,
              caption: item.post.caption,
              mediaUrl: item.post.mediaUrl,
            }
          : null,
        comment: item.comment
          ? {
              id: item.comment.id,
              content: item.comment.content,
            }
          : null,
        targetUrl,
        actionText,
      };
    });

    const unreadCount = await this.getUnreadCount(userId);

    return {
      notifications: formatted,
      nextCursor,
      unreadCount,
    };
  }

  /**
   * Get unread notification count for a user.
   */
  async getUnreadCount(userId: string): Promise<number> {
    if (!userId) return 0;
    return await prisma.notification.count({
      where: {
        recipientId: userId,
        readAt: null,
      },
    });
  }

  /**
   * Mark a single notification as read if owned by the user.
   */
  async markAsRead(params: { notificationId: string; userId: string }) {
    const { notificationId, userId } = params;

    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        recipientId: userId,
      },
      select: { id: true, readAt: true },
    });

    if (!notification) {
      return null;
    }

    if (notification.readAt) {
      return notification;
    }

    return await prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
  }

  /**
   * Mark all unread notifications as read for the user.
   */
  async markAllAsRead(userId: string) {
    if (!userId) return { count: 0 };

    const result = await prisma.notification.updateMany({
      where: {
        recipientId: userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return { count: result.count };
  }
}

export const notificationService = new NotificationService();
