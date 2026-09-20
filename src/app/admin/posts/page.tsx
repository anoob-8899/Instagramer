"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  Trash2,
  MessageSquare,
  Heart,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Eye,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface PostItem {
  id: string;
  caption: string | null;
  mediaUrl: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    role: string;
    status: string;
    displayName: string;
    avatarUrl: string | null;
  };
  likesCount: number;
  commentsCount: number;
}

interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    username: string;
    role: string;
    profile: {
      displayName: string | null;
      avatarUrl: string | null;
    } | null;
  };
}

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search & Pagination
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Delete Post Modal
  const [deleteModalPost, setDeleteModalPost] = useState<PostItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Comments Inspection Modal
  const [inspectPost, setInspectPost] = useState<PostItem | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "12",
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/posts?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch posts");
      }

      const data = await res.json();
      setPosts(data.posts);
      setTotalPages(data.pagination.totalPages || 1);
      setTotalCount(data.pagination.total || 0);
    } catch (err: any) {
      setError(err.message || "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleDeletePost = async () => {
    if (!deleteModalPost) return;
    try {
      setDeleteLoading(true);
      setError(null);
      setSuccessMsg(null);

      const res = await fetch(`/api/admin/posts/${deleteModalPost.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete post");

      setSuccessMsg(data.message || "Post removed successfully");
      setDeleteModalPost(null);
      if (inspectPost?.id === deleteModalPost.id) {
        setInspectPost(null);
      }
      fetchPosts();
    } catch (err: any) {
      setError(err.message || "Failed to delete post");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleOpenComments = async (post: PostItem) => {
    setInspectPost(post);
    setCommentsLoading(true);
    try {
      const res = await fetch(`/api/admin/posts/${post.id}/comments`);
      const data = await res.json();
      if (res.ok) {
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error("Failed to load comments:", err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      setDeleteCommentId(commentId);
      const res = await fetch(`/api/admin/comments/${commentId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete comment");

      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setSuccessMsg("Comment removed successfully");
      fetchPosts();
    } catch (err: any) {
      setError(err.message || "Failed to remove comment");
    } finally {
      setDeleteCommentId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <FileText className="h-6 w-6 text-emerald-500" />
            Content Moderation Console
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review user-generated posts and comments, remove policy violations, and audit deletions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-slate-700 text-slate-300">
            Total Posts: {totalCount}
          </Badge>
          <Button
            size="sm"
            variant="secondary"
            onClick={fetchPosts}
            disabled={loading}
            className="text-xs bg-slate-800 text-slate-200 hover:bg-slate-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/50 p-3 text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="rounded-lg border border-emerald-800 bg-emerald-950/50 p-3 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search Bar */}
      <Card className="border-slate-800 bg-slate-900 text-slate-100">
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search posts by caption or author username..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 bg-slate-950 border-slate-800 text-xs text-slate-100 placeholder:text-slate-500"
              />
            </div>
            <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-xs px-4">
              Filter Posts
            </Button>
            {search && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setSearchInput("");
                  setPage(1);
                }}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Clear
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Posts Table */}
      <Card className="border-slate-800 bg-slate-900 text-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-mono text-[10px]">
                <th className="p-3.5">Media</th>
                <th className="p-3.5">Author</th>
                <th className="p-3.5">Caption Preview</th>
                <th className="p-3.5">Engagement</th>
                <th className="p-3.5">Created</th>
                <th className="p-3.5 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Loading posts for moderation...
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No posts matching search criteria found.
                  </td>
                </tr>
              ) : (
                posts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Media Thumbnail */}
                    <td className="p-3.5">
                      <div className="h-12 w-12 rounded bg-slate-800 border border-slate-700 overflow-hidden shrink-0">
                        <img
                          src={p.mediaUrl}
                          alt="Post preview"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      </div>
                    </td>

                    {/* Author */}
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-100">
                        <Link href={`/admin/users/${p.author.id}`} className="hover:underline">
                          @{p.author.username}
                        </Link>
                      </div>
                      <div className="text-[11px] text-slate-400">{p.author.displayName}</div>
                    </td>

                    {/* Caption */}
                    <td className="p-3.5 max-w-xs truncate text-slate-300">
                      {p.caption || <span className="text-slate-500 italic">No caption</span>}
                    </td>

                    {/* Engagement */}
                    <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3 text-red-400" /> {p.likesCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3 text-blue-400" /> {p.commentsCount}
                        </span>
                      </div>
                    </td>

                    {/* Created Date */}
                    <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenComments(p)}
                          className="h-7 px-2 text-xs text-blue-400 hover:bg-blue-950/50"
                          title="Inspect Comments"
                        >
                          <MessageSquare className="h-3.5 w-3.5 mr-1" /> Comments
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteModalPost(p)}
                          className="h-7 px-2 text-xs text-red-400 hover:bg-red-950/50 hover:text-red-300"
                          title="Delete Post"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing Page <span className="font-semibold text-slate-200">{page}</span> of{" "}
            <span className="font-semibold text-slate-200">{totalPages}</span> ({totalCount} total)
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-7 px-2 bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-7 px-2 bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Delete Post Confirmation Modal */}
      {deleteModalPost && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-950/80 border border-red-800 text-red-400">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Remove Post by @{deleteModalPost.author.username}?</h3>
                <p className="text-xs text-slate-400">This action will permanently delete this post and its comments.</p>
              </div>
            </div>

            <div className="text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
              <p>
                Author: <strong>@{deleteModalPost.author.username}</strong>
              </p>
              {deleteModalPost.caption && <p className="italic text-slate-400">"{deleteModalPost.caption}"</p>}
              <p className="text-red-400 text-[11px]">
                Relational cascade will delete {deleteModalPost.commentsCount} comments and {deleteModalPost.likesCount} likes.
                An audit event will be recorded.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteModalPost(null)}
                disabled={deleteLoading}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDeletePost}
                disabled={deleteLoading}
                className="text-xs bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteLoading ? "Deleting..." : "Confirm Deletion"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Comments Inspection Drawer / Modal */}
      {inspectPost && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  Comments on @{inspectPost.author.username}'s Post
                </h3>
                <p className="text-[11px] text-slate-400">Moderate individual comments</p>
              </div>
              <button
                onClick={() => setInspectPost(null)}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {commentsLoading ? (
                <div className="p-6 text-center text-xs text-slate-500">Loading comments...</div>
              ) : comments.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">No comments found on this post.</div>
              ) : (
                comments.map((c) => (
                  <div
                    key={c.id}
                    className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">@{c.author.username}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(c.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-300">{c.content}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteComment(c.id)}
                      disabled={deleteCommentId === c.id}
                      className="h-6 px-1.5 text-xs text-red-400 hover:bg-red-950/60 shrink-0"
                      title="Remove Comment"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-slate-800 flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setInspectPost(null)}
                className="text-xs bg-slate-800 text-slate-200 hover:bg-slate-700"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
