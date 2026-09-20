"use client";

import React from "react";
import Link from "next/link";
import { Camera, PlusSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const FeedEmptyState: React.FC = () => {
  return (
    <div className="mx-auto my-8 max-w-md rounded-2xl border border-slate-200/90 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-100 to-indigo-100 text-blue-600 dark:from-blue-950/60 dark:to-indigo-950/60 dark:text-blue-400">
        <Camera className="h-8 w-8 stroke-[1.5]" />
      </div>

      <h2 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">
        Your feed is empty
      </h2>

      <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        Posts from creators you follow and your own posts will appear here. Start sharing your favorite moments or follow other creators.
      </p>

      <div className="mt-6 flex flex-col gap-2.5">
        <Link href="/create" className="w-full">
          <Button className="w-full gap-2 shadow-sm">
            <PlusSquare className="h-4 w-4" />
            <span>Create your first post</span>
          </Button>
        </Link>
      </div>
    </div>
  );
};
