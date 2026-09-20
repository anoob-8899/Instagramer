"use client";

import React, { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
      <Suspense
        fallback={
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span>Loading login...</span>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
      <footer className="mt-8 text-center text-xs text-slate-400 dark:text-slate-600">
        Instagramer &copy; 2026 &bull; Secure Authentication Module
      </footer>
    </div>
  );
}
