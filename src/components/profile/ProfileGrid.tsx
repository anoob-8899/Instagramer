"use client";

import React, { useState } from "react";
import { Grid, Bookmark, Tag } from "lucide-react";
import { clsx } from "clsx";
import { PostGrid } from "@/components/post/PostGrid";
import { PostItem } from "@/types/post";

export interface ProfileGridProps {
  posts?: PostItem[];
  isOwnProfile?: boolean;
}

export const ProfileGrid: React.FC<ProfileGridProps> = ({
  posts = [],
  isOwnProfile = false,
}) => {
  const [activeTab, setActiveTab] = useState<"posts" | "saved" | "tagged">("posts");

  return (
    <div className="mt-6">
      {/* Navigation Tabs */}
      <div className="flex justify-center border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab("posts")}
          className={clsx(
            "flex items-center gap-2 border-t-2 px-6 py-3 text-xs font-bold uppercase tracking-wider transition-colors",
            activeTab === "posts"
              ? "border-slate-900 text-slate-900 dark:border-white dark:text-white"
              : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          )}
        >
          <Grid className="h-3.5 w-3.5" />
          <span>Posts</span>
        </button>

        {isOwnProfile && (
          <button
            type="button"
            onClick={() => setActiveTab("saved")}
            className={clsx(
              "flex items-center gap-2 border-t-2 px-6 py-3 text-xs font-bold uppercase tracking-wider transition-colors",
              activeTab === "saved"
                ? "border-slate-900 text-slate-900 dark:border-white dark:text-white"
                : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            )}
          >
            <Bookmark className="h-3.5 w-3.5" />
            <span>Saved</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab("tagged")}
          className={clsx(
            "flex items-center gap-2 border-t-2 px-6 py-3 text-xs font-bold uppercase tracking-wider transition-colors",
            activeTab === "tagged"
              ? "border-slate-900 text-slate-900 dark:border-white dark:text-white"
              : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          )}
        >
          <Tag className="h-3.5 w-3.5" />
          <span>Tagged</span>
        </button>
      </div>

      {/* Grid Content */}
      <div className="mt-4">
        {activeTab === "posts" && (
          <PostGrid posts={posts} emptyMessage="No posts yet" />
        )}
        {activeTab === "saved" && (
          <PostGrid posts={[]} emptyMessage="No saved posts yet" />
        )}
        {activeTab === "tagged" && (
          <PostGrid posts={[]} emptyMessage="Photos of you will appear here" />
        )}
      </div>
    </div>
  );
};
