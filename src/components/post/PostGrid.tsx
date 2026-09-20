"use client";

import React from "react";
import { Heart, MessageCircle, Camera } from "lucide-react";
import { PostItem } from "@/types/post";

export interface PostGridProps {
  posts?: PostItem[];
  emptyMessage?: string;
}

export const PostGrid: React.FC<PostGridProps> = ({
  posts = [],
  emptyMessage = "No posts yet",
}) => {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-slate-300 dark:border-slate-700 text-slate-400">
          <Camera className="h-8 w-8 stroke-1" />
        </div>
        <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
          {emptyMessage}
        </h3>
        <p className="mt-1 text-xs text-slate-500 max-w-xs">
          When photos and videos are shared, they will appear on this grid.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1 sm:gap-4 md:grid-cols-3">
      {posts.map((post) => (
        <div
          key={post.id}
          className="group relative aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer rounded-sm sm:rounded-lg"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.imageUrl}
            alt={post.caption || "Post thumbnail"}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105 motion-reduce:transition-none"
            loading="lazy"
          />

          {/* Hover Overlay with Stats */}
          <div className="absolute inset-0 flex items-center justify-center gap-6 bg-black/40 opacity-0 transition-opacity duration-150 group-hover:opacity-100 motion-reduce:transition-none">
            <div className="flex items-center gap-1.5 text-sm font-bold text-white">
              <Heart className="h-4 w-4 fill-white" />
              <span>{post.likesCount || 0}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-bold text-white">
              <MessageCircle className="h-4 w-4 fill-white" />
              <span>{post.commentsCount || 0}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
