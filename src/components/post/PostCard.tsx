"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  Sparkles,
  Trash2,
  Loader2,
  AlertCircle,
  Flag,
  CheckCircle2,
  X,
} from "lucide-react";
import { clsx } from "clsx";
import { CommentItem } from "@/types/post";

export interface PostAuthor {
  id: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
}

export interface PostCardProps {
  id: string;
  author: PostAuthor;
  imageUrl: string;
  caption: string;
  createdAt: Date | string;
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
  isDemo?: boolean;
  currentUserId?: string;
  onPostDeleted?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  id,
  author,
  imageUrl,
  caption,
  createdAt,
  likesCount = 0,
  commentsCount = 0,
  isLiked: initialIsLiked = false,
  isDemo = false,
  currentUserId,
  onPostDeleted,
}) => {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [isSaved, setIsSaved] = useState(false);
  const [currentLikes, setCurrentLikes] = useState(likesCount);
  const [currentCommentsCount, setCurrentCommentsCount] = useState(commentsCount);
  const [isLiking, setIsLiking] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Comments state
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  // Post options state
  const [showMenu, setShowMenu] = useState(false);
  const [isDeletingPost, setIsDeletingPost] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const isOwnPost = currentUserId !== undefined && currentUserId === author.id;

  const handleToggleLike = async () => {
    if (isDemo || isLiking) return;

    // Optimistic update
    const nextLiked = !isLiked;
    const nextLikesCount = nextLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1);
    setIsLiked(nextLiked);
    setCurrentLikes(nextLikesCount);
    setIsLiking(true);

    try {
      const res = await fetch(`/api/posts/${id}/like`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Failed to toggle like");
      }

      const data = await res.json();
      setIsLiked(data.liked);
      setCurrentLikes(data.likeCount);
    } catch {
      // Revert on error
      setIsLiked(!nextLiked);
      setCurrentLikes(isLiked ? currentLikes : Math.max(0, currentLikes - 1));
    } finally {
      setIsLiking(false);
    }
  };

  const handleToggleSave = () => {
    setIsSaved((prev) => !prev);
  };

  const fetchComments = async () => {
    if (isDemo) return;
    setLoadingComments(true);
    setCommentError(null);
    try {
      const res = await fetch(`/api/posts/${id}/comments`);
      if (!res.ok) throw new Error("Failed to load comments");
      const data = await res.json();
      setComments(data.comments || []);
    } catch {
      setCommentError("Could not load comments");
    } finally {
      setLoadingComments(false);
    }
  };

  const handleToggleComments = () => {
    const nextShow = !showComments;
    setShowComments(nextShow);
    if (nextShow && comments.length === 0) {
      fetchComments();
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemo || !newComment.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    setCommentError(null);

    try {
      const res = await fetch(`/api/posts/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to add comment");
      }

      const data = await res.json();
      setComments((prev) => [...prev, data.comment]);
      setCurrentCommentsCount((prev) => prev + 1);
      setNewComment("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setCommentError(err.message);
      } else {
        setCommentError("Failed to add comment");
      }
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete comment");

      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setCurrentCommentsCount((prev) => Math.max(0, prev - 1));
    } catch {
      setCommentError("Failed to delete comment");
    }
  };

  const handleDeletePost = async () => {
    if (!isOwnPost || isDeletingPost) return;
    setIsDeletingPost(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete post");
      }

      setShowMenu(false);
      onPostDeleted?.(id);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setDeleteError(err.message);
      } else {
        setDeleteError("Failed to delete post");
      }
      setIsDeletingPost(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason.trim() || isSubmittingReport) return;

    setIsSubmittingReport(true);
    setReportError(null);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType: "POST",
          targetId: id,
          reason: reportReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit report");
      }

      setReportSuccess(true);
      setTimeout(() => {
        setShowReportModal(false);
        setReportSuccess(false);
        setReportReason("");
      }, 1500);
    } catch (err: any) {
      setReportError(err.message || "Failed to submit report");
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Format date display
  const formattedDate =
    typeof createdAt === "string"
      ? createdAt
      : new Date(createdAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        });

  return (
    <article
      className="mx-auto w-full max-w-lg rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden"
      aria-label={`Post by @${author.username}`}
    >
      {/* Post Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 relative">
        <div className="flex items-center gap-3">
          <Link
            href={`/profile/${author.username}`}
            className="group flex items-center gap-2.5"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 text-xs font-bold text-white uppercase shadow-sm ring-2 ring-transparent group-hover:ring-rose-400 transition-all">
              {author.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={author.avatarUrl}
                  alt={`@${author.username}'s avatar`}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                (author.displayName || author.username).slice(0, 2)
              )}
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 group-hover:underline dark:text-slate-100">
                {author.username}
              </span>
              {author.displayName && (
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  {author.displayName}
                </p>
              )}
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {isDemo && (
            <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800">
              <Sparkles className="h-3 w-3" />
              Demo Post
            </span>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              aria-label="Post Options"
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-9 z-20 w-36 rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                {isOwnPost ? (
                  <button
                    type="button"
                    onClick={handleDeletePost}
                    disabled={isDeletingPost}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-colors disabled:opacity-50"
                  >
                    {isDeletingPost ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    <span>Delete Post</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      setShowReportModal(true);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40 transition-colors"
                  >
                    <Flag className="h-3.5 w-3.5" />
                    <span>Report Post</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {deleteError && (
        <div className="flex items-center gap-2 border-b border-rose-100 bg-rose-50 px-4 py-2 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{deleteError}</span>
        </div>
      )}

      {/* Post Image Container */}
      <div className="relative aspect-square w-full bg-slate-100 dark:bg-slate-950 overflow-hidden flex items-center justify-center">
        {!imageLoaded && (
          <div className="absolute inset-0 animate-pulse bg-slate-200 dark:bg-slate-800" />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={caption ? `Post image: ${caption.slice(0, 60)}` : "Post image"}
          onLoad={() => setImageLoaded(true)}
          className={clsx(
            "h-full w-full object-cover transition-opacity duration-300",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
          loading="lazy"
        />
      </div>

      {/* Action Toolbar */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleToggleLike}
              disabled={isLiking}
              aria-label={isLiked ? "Unlike post" : "Like post"}
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors disabled:opacity-75"
            >
              <Heart
                className={clsx(
                  "h-6 w-6 transition-transform motion-reduce:transition-none",
                  isLiked
                    ? "fill-rose-500 text-rose-500 scale-110"
                    : "hover:scale-105"
                )}
              />
            </button>

            <button
              type="button"
              onClick={handleToggleComments}
              aria-label="Comments"
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              <MessageCircle
                className={clsx(
                  "h-6 w-6 hover:scale-105 transition-transform motion-reduce:transition-none",
                  showComments && "text-blue-600 dark:text-blue-400"
                )}
              />
            </button>

            <button
              type="button"
              aria-label="Share Post"
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              <Send className="h-5 w-5 hover:scale-105 transition-transform motion-reduce:transition-none" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleToggleSave}
            aria-label={isSaved ? "Remove from saved" : "Save post"}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
          >
            <Bookmark
              className={clsx(
                "h-6 w-6 transition-transform motion-reduce:transition-none",
                isSaved
                  ? "fill-slate-900 text-slate-900 dark:fill-white dark:text-white"
                  : "hover:scale-105"
              )}
            />
          </button>
        </div>

        {/* Likes Count */}
        <div className="mt-1">
          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
            {currentLikes.toLocaleString()} {currentLikes === 1 ? "like" : "likes"}
          </p>
        </div>

        {/* Caption */}
        {caption && (
          <div className="mt-1.5 text-xs leading-relaxed text-slate-800 dark:text-slate-200">
            <Link
              href={`/profile/${author.username}`}
              className="font-bold text-slate-950 hover:underline dark:text-white mr-1.5"
            >
              {author.username}
            </Link>
            <span className="whitespace-pre-line">{caption}</span>
          </div>
        )}

        {/* Comments info trigger */}
        {currentCommentsCount > 0 && !showComments && (
          <button
            type="button"
            onClick={handleToggleComments}
            className="mt-1 block text-xs text-slate-500 hover:underline dark:text-slate-400"
          >
            View all {currentCommentsCount} {currentCommentsCount === 1 ? "comment" : "comments"}
          </button>
        )}

        {/* Timestamp */}
        <time
          dateTime={typeof createdAt === "string" ? createdAt : new Date(createdAt).toISOString()}
          className="my-2 block text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500"
        >
          {formattedDate}
        </time>

        {/* Interactive Comments Section */}
        {showComments && (
          <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800/80">
            {commentError && (
              <div className="mb-2 flex items-center gap-1.5 text-[11px] text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-3 w-3 shrink-0" />
                <span>{commentError}</span>
              </div>
            )}

            {loadingComments ? (
              <div className="flex items-center justify-center py-4 text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {comments.length === 0 ? (
                  <p className="text-[11px] italic text-slate-400 py-1">
                    No comments yet. Be the first to comment!
                  </p>
                ) : (
                  comments.map((c) => {
                    const isOwnComment =
                      currentUserId !== undefined && currentUserId === c.authorId;
                    return (
                      <div
                        key={c.id}
                        className="group flex items-start justify-between text-xs leading-relaxed"
                      >
                        <div className="flex-1">
                          <Link
                            href={`/profile/${c.author.username}`}
                            className="font-bold text-slate-900 hover:underline dark:text-white mr-1.5"
                          >
                            {c.author.username}
                          </Link>
                          <span className="text-slate-700 dark:text-slate-300">
                            {c.content}
                          </span>
                        </div>

                        {isOwnComment && (
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(c.id)}
                            aria-label="Delete comment"
                            className="ml-2 text-slate-400 opacity-0 hover:text-rose-500 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                maxLength={1000}
                disabled={isSubmittingComment}
                className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-500"
              />
              <button
                type="submit"
                disabled={isSubmittingComment || !newComment.trim()}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 disabled:opacity-40 dark:text-blue-400"
              >
                {isSubmittingComment ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Post"
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Report Post Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-sm">
                <Flag className="h-4 w-4 text-amber-500" />
                <span>Report Post</span>
              </div>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportError(null);
                  setReportSuccess(false);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {reportSuccess ? (
              <div className="py-4 text-center space-y-2">
                <div className="flex justify-center text-emerald-500">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Report submitted. Thank you for keeping our community safe.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Why are you reporting this post by <strong>@{author.username}</strong>?
                </p>

                {reportError && (
                  <div className="p-2 rounded bg-rose-50 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900 text-[11px] text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    <span>{reportError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  {[
                    "Spam or misleading content",
                    "Hate speech, harassment or bullying",
                    "Violence or dangerous content",
                    "Intellectual property violation",
                    "Inappropriate or adult content",
                  ].map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setReportReason(preset)}
                      className={`w-full text-left p-2 rounded-lg border text-xs transition-colors ${
                        reportReason === preset
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium"
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Or provide additional details..."
                  rows={2}
                  maxLength={500}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                />

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    disabled={isSubmittingReport}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!reportReason.trim() || isSubmittingReport}
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSubmittingReport && <Loader2 className="h-3 w-3 animate-spin" />}
                    Submit Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </article>
  );
};
