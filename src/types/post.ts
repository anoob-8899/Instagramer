export interface PostAuthor {
  id: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
}

export interface PostItem {
  id: string;
  author: PostAuthor;
  imageUrl: string;
  caption: string;
  createdAt: Date | string;
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  isSaved?: boolean;
  isDemo?: boolean;
}

export interface CommentAuthor {
  id: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
}

export interface CommentItem {
  id: string;
  postId: string;
  authorId: string;
  author: CommentAuthor;
  content: string;
  createdAt: Date | string;
}
