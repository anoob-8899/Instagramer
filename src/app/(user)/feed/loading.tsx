import React from "react";

export default function FeedLoading() {
  return (
    <div className="flex justify-center gap-8 py-2 animate-pulse">
      <div className="w-full max-w-lg space-y-6">
        {/* Stories Skeleton */}
        <div className="flex items-center gap-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="h-16 w-16 rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="h-2.5 w-12 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          ))}
        </div>

        {/* Post Skeletons */}
        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden"
          >
            <div className="flex items-center gap-3 p-4">
              <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-2.5 w-16 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
            <div className="aspect-square w-full bg-slate-200 dark:bg-slate-800" />
            <div className="p-4 space-y-3">
              <div className="flex gap-3">
                <div className="h-6 w-6 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-6 w-6 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-6 w-6 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="h-3 w-32 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar Skeleton */}
      <div className="hidden w-72 space-y-6 lg:block">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-2.5 w-16 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
