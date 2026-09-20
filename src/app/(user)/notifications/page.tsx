"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { NotificationDTO } from "@/types/notification";
import {
  Bell,
  Heart,
  MessageSquare,
  UserPlus,
  MessageCircle,
  Shield,
  CheckCheck,
  Loader2,
  Check,
  ArrowRight,
} from "lucide-react";
import { clsx } from "clsx";

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [isMarkingAll, setIsMarkingAll] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/notifications?limit=20");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      if (!res.ok) {
        throw new Error("Failed to load notifications");
      }
      const data = await res.json();
      setNotifications(data.notifications || []);
      setNextCursor(data.nextCursor || null);
      setUnreadCount(data.unreadCount ?? 0);
    } catch (err: unknown) {
      console.error("Error fetching notifications:", err);
      setError("Unable to load your notifications right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const res = await fetch(`/api/notifications?limit=20&cursor=${nextCursor}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications((prev) => [...prev, ...(data.notifications || [])]);
        setNextCursor(data.nextCursor || null);
      }
    } catch (err) {
      console.error("Error loading more notifications:", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string, targetUrl?: string) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, readAt: new Date().toISOString() } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PATCH",
      });
      window.dispatchEvent(new CustomEvent("notification-updated"));
    } catch (err) {
      console.error("Error marking notification read:", err);
    }

    if (targetUrl) {
      router.push(targetUrl);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0 || isMarkingAll) return;
    setIsMarkingAll(true);

    // Optimistic update
    const nowIso = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((n) => (n.readAt ? n : { ...n, readAt: nowIso }))
    );
    setUnreadCount(0);

    try {
      await fetch("/api/notifications/read-all", {
        method: "PATCH",
      });
      window.dispatchEvent(new CustomEvent("notification-updated"));
    } catch (err) {
      console.error("Error marking all read:", err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const renderTypeIcon = (type: string) => {
    switch (type) {
      case "LIKE":
        return (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
            <Heart className="h-3 w-3 fill-white stroke-none" />
          </span>
        );
      case "COMMENT":
        return (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
            <MessageSquare className="h-3 w-3 stroke-[2.5]" />
          </span>
        );
      case "FOLLOW":
        return (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
            <UserPlus className="h-3 w-3 stroke-[2.5]" />
          </span>
        );
      case "MESSAGE":
        return (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
            <MessageCircle className="h-3 w-3 stroke-[2.5]" />
          </span>
        );
      case "SYSTEM":
        return (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
            <Shield className="h-3 w-3 stroke-[2.5]" />
          </span>
        );
      default:
        return (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-500 text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
            <Bell className="h-3 w-3 stroke-[2.5]" />
          </span>
        );
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-2">
      {/* Header with Title and Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="rounded-full bg-rose-500 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time updates on likes, comments, follows, and messages
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAll}
            className="inline-flex items-center gap-1.5 self-start rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            aria-label="Mark all notifications as read"
          >
            {isMarkingAll ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            )}
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Notifications Card */}
      <Card className="rounded-2xl border-slate-200/90 shadow-sm dark:border-slate-800 overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 px-5 py-3.5 dark:border-slate-800/80 dark:bg-slate-900/40">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Recent Activity
            </CardTitle>
            <span className="text-[11px] text-slate-400">
              {notifications.length} {notifications.length === 1 ? "notification" : "notifications"}
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {error && (
            <div className="p-6 text-center">
              <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>
              <button
                onClick={fetchNotifications}
                className="mt-3 inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3.5 p-4 animate-pulse">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200 dark:bg-slate-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-2.5 w-1/4 rounded bg-slate-200 dark:bg-slate-800" />
                  </div>
                  <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-800" />
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400">
                <Bell className="h-7 w-7 stroke-[1.5]" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-slate-800 dark:text-slate-200">
                You&apos;re all caught up!
              </h3>
              <p className="mt-1 text-xs text-slate-400 max-w-xs">
                When people interact with your posts, send messages, or follow you, you&apos;ll see updates here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {notifications.map((item) => {
                const isUnread = !item.readAt;

                return (
                  <div
                    key={item.id}
                    className={clsx(
                      "group relative flex items-center justify-between gap-3.5 p-4 transition-colors",
                      isUnread
                        ? "bg-blue-50/40 hover:bg-blue-50/70 dark:bg-blue-950/20 dark:hover:bg-blue-950/40"
                        : "hover:bg-slate-50/80 dark:hover:bg-slate-900/50"
                    )}
                  >
                    {/* Unread Indicator Pill */}
                    {isUnread && (
                      <span
                        className="absolute left-1.5 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 shadow-sm"
                        aria-label="Unread notification"
                      />
                    )}

                    {/* Actor Avatar & Type Badge */}
                    <div className="relative shrink-0 pl-1">
                      <Link
                        href={`/profile/${item.actor.username}`}
                        className="block focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {item.actor.avatarUrl ? (
                          <img
                            src={item.actor.avatarUrl}
                            alt={item.actor.username}
                            className="h-10 w-10 rounded-full object-cover shadow-sm ring-1 ring-slate-200 dark:ring-slate-700"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-xs font-bold text-white uppercase shadow-sm">
                            {item.actor.displayName
                              ? item.actor.displayName.slice(0, 2)
                              : item.actor.username.slice(0, 2)}
                          </div>
                        )}
                      </Link>
                      <span className="absolute -bottom-1 -right-1">
                        {renderTypeIcon(item.type)}
                      </span>
                    </div>

                    {/* Notification Body / Link */}
                    <button
                      onClick={() => handleMarkAsRead(item.id, item.targetUrl)}
                      className="min-w-0 flex-1 text-left focus:outline-none"
                    >
                      <div className="text-xs text-slate-800 dark:text-slate-200 leading-snug">
                        <span className="font-bold hover:underline">
                          {item.actor.displayName || item.actor.username}
                        </span>{" "}
                        <span className="text-slate-600 dark:text-slate-400">
                          {item.actionText}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                        {formatRelativeTime(item.createdAt)}
                      </p>
                    </button>

                    {/* Related Post Thumbnail or Action Button */}
                    <div className="flex items-center gap-2 shrink-0">
                      {item.post?.mediaUrl ? (
                        <button
                          onClick={() => handleMarkAsRead(item.id, item.targetUrl)}
                          className="group/img block overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800"
                          aria-label="View related post"
                        >
                          <img
                            src={item.post.mediaUrl}
                            alt="Post thumbnail"
                            className="h-10 w-10 object-cover transition-transform group-hover/img:scale-105"
                          />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleMarkAsRead(item.id, item.targetUrl)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-all"
                          aria-label="Navigate"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      )}

                      {/* Explicit Mark as Read Checkmark Button */}
                      {isUnread && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(item.id);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-800 dark:hover:text-blue-400 transition-colors"
                          title="Mark as read"
                          aria-label="Mark notification as read"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination: Load More Button */}
          {nextCursor && (
            <div className="border-t border-slate-100 p-4 text-center dark:border-slate-800/80">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Loading more...</span>
                  </>
                ) : (
                  <span>Load older notifications</span>
                )}
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
