export type NotificationType = "LIKE" | "COMMENT" | "FOLLOW" | "MESSAGE" | "SYSTEM";

export interface NotificationActorDTO {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface NotificationPostPreviewDTO {
  id: string;
  caption: string | null;
  mediaUrl: string;
}

export interface NotificationCommentPreviewDTO {
  id: string;
  content: string;
}

export interface NotificationDTO {
  id: string;
  recipientId: string;
  actorId: string;
  type: NotificationType;
  postId: string | null;
  commentId: string | null;
  readAt: string | null;
  createdAt: string;
  actor: NotificationActorDTO;
  post: NotificationPostPreviewDTO | null;
  comment: NotificationCommentPreviewDTO | null;
  targetUrl: string;
  actionText: string;
}

export interface NotificationListResponse {
  notifications: NotificationDTO[];
  nextCursor: string | null;
  unreadCount?: number;
}

export interface UnreadCountResponse {
  count: number;
}
