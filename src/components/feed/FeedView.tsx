"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PostCard } from "@/components/post/PostCard";
import { FeedEmptyState } from "@/components/feed/FeedEmptyState";
import { PostItem } from "@/types/post";
import { CheckCircle2, UserPlus, Check, Loader2 } from "lucide-react";

export interface FeedUser {
  id: string;
  username: string;
  email: string;
  role: string;
  displayName?: string | null;
  avatarUrl?: string | null;
}

export interface SuggestedUser {
  id: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
}

export interface FeedViewProps {
  currentUser: FeedUser;
  initialPosts: PostItem[];
  suggestedUsers: SuggestedUser[];
}

export const FeedView: React.FC<FeedViewProps> = ({
  currentUser,
  initialPosts = [],
  suggestedUsers: initialSuggestedUsers = [],
}) => {
  const [posts, setPosts] = useState<PostItem[]>(initialPosts);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [inFlightMap, setInFlightMap] = useState<Record<string, boolean>>({});

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleToggleFollow = async (username: string) => {
    if (inFlightMap[username]) return;

    const currentStatus = Boolean(followingMap[username]);
    const nextStatus = !currentStatus;

    setFollowingMap((prev) => ({ ...prev, [username]: nextStatus }));
    setInFlightMap((prev) => ({ ...prev, [username]: true }));

    try {
      const res = await fetch(`/api/users/${encodeURIComponent(username)}/follow`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Failed to follow user");
      }

      const data = await res.json();
      setFollowingMap((prev) => ({ ...prev, [username]: data.following }));
    } catch {
      // Revert on error
      setFollowingMap((prev) => ({ ...prev, [username]: currentStatus }));
    } finally {
      setInFlightMap((prev) => ({ ...prev, [username]: false }));
    }
  };

  return (
    <div className="flex justify-center gap-8">
      {/* Main Feed Column */}
      <div className="w-full max-w-lg space-y-6">
        {/* Feed Posts or Empty State */}
        {posts.length > 0 ? (
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                id={post.id}
                author={post.author}
                imageUrl={post.imageUrl}
                caption={post.caption}
                createdAt={post.createdAt}
                likesCount={post.likesCount}
                commentsCount={post.commentsCount}
                isLiked={post.isLiked}
                isDemo={post.isDemo}
                currentUserId={currentUser.id}
                onPostDeleted={handlePostDeleted}
              />
            ))}

            {/* End of Feed Indicator */}
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-6 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="mt-3 font-semibold text-slate-800 dark:text-slate-200">
                You&apos;ve caught up with all current posts!
              </p>
              <p className="mt-1 text-slate-400">
                Share a new photo or discover other creators to see more updates.
              </p>
            </div>
          </div>
        ) : (
          <FeedEmptyState />
        )}
      </div>

      {/* Right Sidebar Widget (Desktop Only) */}
      <aside
        className="hidden w-72 space-y-6 lg:block select-none"
        aria-label="Feed Sidebar"
      >
        {/* User Mini Profile */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Link
            href={`/profile/${currentUser.username}`}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-sm font-bold text-white uppercase shadow-sm">
              {currentUser.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentUser.avatarUrl}
                  alt={`@${currentUser.username}`}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                (currentUser.displayName || currentUser.username).slice(0, 2)
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                @{currentUser.username}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[130px]">
                {currentUser.displayName || "Instagramer User"}
              </p>
            </div>
          </Link>
          <Link
            href={`/profile/${currentUser.username}`}
            className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            View
          </Link>
        </div>

        {/* Suggested Creators Widget */}
        {initialSuggestedUsers.length > 0 && (
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Suggested for you
              </span>
            </div>

            <div className="space-y-3">
              {initialSuggestedUsers.map((su) => {
                const isFollowing = Boolean(followingMap[su.username]);
                const isInFlight = Boolean(inFlightMap[su.username]);

                return (
                  <div key={su.id} className="flex items-center justify-between text-xs">
                    <Link
                      href={`/profile/${su.username}`}
                      className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold uppercase text-slate-700 dark:bg-slate-800 dark:text-slate-200 overflow-hidden">
                        {su.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={su.avatarUrl}
                            alt={`@${su.username}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          (su.displayName || su.username).slice(0, 2)
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          @{su.username}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[110px]">
                          {su.displayName || "New creator"}
                        </p>
                      </div>
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleToggleFollow(su.username)}
                      disabled={isInFlight}
                      className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 disabled:opacity-50"
                    >
                      {isInFlight ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : isFollowing ? (
                        <>
                          <Check className="h-3 w-3" />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-3 w-3" />
                          <span>Follow</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer info */}
        <footer className="px-2 text-[11px] leading-relaxed text-slate-400 dark:text-slate-600">
          <p>&bull; About &bull; Help &bull; API &bull; Privacy &bull; Terms</p>
          <p className="mt-1">&copy; 2026 INSTAGRAMER SOCIAL</p>
        </footer>
      </aside>
    </div>
  );
};
