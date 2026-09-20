"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Settings, UserPlus, MessageCircle, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface ProfileUserData {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: Date | string;
}

export interface ProfileHeaderProps {
  user: ProfileUserData;
  isOwnProfile: boolean;
  isFollowingInitial?: boolean;
  postsCount?: number;
  followersCount?: number;
  followingCount?: number;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  isOwnProfile,
  isFollowingInitial = false,
  postsCount = 0,
  followersCount: initialFollowersCount = 0,
  followingCount = 0,
}) => {
  const [isFollowing, setIsFollowing] = useState(isFollowingInitial);
  const [followersCount, setFollowersCount] = useState(initialFollowersCount);
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);

  const handleToggleFollow = async () => {
    if (isOwnProfile || isTogglingFollow) return;

    // Optimistic update
    const nextFollowing = !isFollowing;
    const nextFollowersCount = nextFollowing
      ? followersCount + 1
      : Math.max(0, followersCount - 1);

    setIsFollowing(nextFollowing);
    setFollowersCount(nextFollowersCount);
    setIsTogglingFollow(true);

    try {
      const res = await fetch(`/api/users/${encodeURIComponent(user.username)}/follow`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Failed to update follow status");
      }

      const data = await res.json();
      setIsFollowing(data.following);
      setFollowersCount(data.followerCount);
    } catch {
      // Revert on error
      setIsFollowing(!nextFollowing);
      setFollowersCount(isFollowing ? followersCount : Math.max(0, followersCount - 1));
    } finally {
      setIsTogglingFollow(false);
    }
  };

  const formattedJoinedDate = new Date(user.createdAt).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <header className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
        {/* Avatar Section */}
        <div className="flex justify-center md:justify-start">
          <div className="relative flex h-24 w-24 sm:h-28 sm:w-28 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 p-0.5 shadow-md">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-white dark:bg-slate-900 overflow-hidden">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt={`@${user.username}'s profile picture`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-slate-100 text-2xl font-bold uppercase text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {(user.displayName || user.username).slice(0, 2)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Info & Actions */}
        <div className="flex-1 text-center md:text-left">
          {/* Top Row: Username & Controls */}
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-start">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              @{user.username}
            </h1>

            <div className="flex flex-wrap items-center gap-2">
              {isOwnProfile ? (
                <>
                  <Link href="/settings">
                    <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-semibold">
                      <Settings className="h-3.5 w-3.5" />
                      <span>Edit Profile</span>
                    </Button>
                  </Link>
                  <Link href="/settings">
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" aria-label="Settings">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant={isFollowing ? "outline" : "primary"}
                    onClick={handleToggleFollow}
                    disabled={isTogglingFollow}
                    className="h-8 gap-1.5 text-xs font-semibold"
                  >
                    {isTogglingFollow ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : isFollowing ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>Follow</span>
                      </>
                    )}
                  </Button>
                  <Link href="/messages">
                    <Button variant="secondary" size="sm" className="h-8 gap-1.5 text-xs font-semibold">
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>Message</span>
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="mt-4 flex justify-center gap-8 border-y border-slate-100 py-3 text-xs md:justify-start dark:border-slate-800/80">
            <div>
              <span className="font-bold text-slate-900 dark:text-white">
                {postsCount}
              </span>{" "}
              <span className="text-slate-500 dark:text-slate-400">
                {postsCount === 1 ? "post" : "posts"}
              </span>
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white">
                {followersCount}
              </span>{" "}
              <span className="text-slate-500 dark:text-slate-400">
                {followersCount === 1 ? "follower" : "followers"}
              </span>
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white">
                {followingCount}
              </span>{" "}
              <span className="text-slate-500 dark:text-slate-400">following</span>
            </div>
          </div>

          {/* Bio & Details */}
          <div className="mt-4 space-y-1 text-xs">
            {user.displayName && (
              <p className="font-bold text-slate-900 dark:text-white">
                {user.displayName}
              </p>
            )}
            {user.bio ? (
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {user.bio}
              </p>
            ) : (
              <p className="italic text-slate-400 dark:text-slate-500">
                No bio provided yet.
              </p>
            )}
            <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-1">
              Joined {formattedJoinedDate}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
