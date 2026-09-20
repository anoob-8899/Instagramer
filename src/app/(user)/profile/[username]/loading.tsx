import React from "react";

export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-4xl py-4 space-y-6 animate-pulse">
      {/* Profile Header Skeleton */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
          <div className="flex justify-center md:justify-start">
            <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-start">
              <div className="h-6 w-36 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-8 w-24 rounded-lg bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="flex justify-center gap-8 py-2 md:justify-start">
              <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-48 rounded bg-slate-200 dark:bg-slate-800 mx-auto md:mx-0" />
              <div className="h-3 w-32 rounded bg-slate-200 dark:bg-slate-800 mx-auto md:mx-0" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid Tabs Skeleton */}
      <div className="flex justify-center gap-8 border-t border-slate-200 pt-3 dark:border-slate-800">
        <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-800" />
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-3 gap-1 sm:gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="aspect-square w-full rounded-sm sm:rounded-lg bg-slate-200 dark:bg-slate-800"
          />
        ))}
      </div>
    </div>
  );
}
