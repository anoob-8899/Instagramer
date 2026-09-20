"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/Card";
import { AlertCircle, Clock, ShieldCheck, Camera, Loader2 } from "lucide-react";

export const LoginForm: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/feed";
  const wasRegistered = searchParams.get("registered") === "true";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLocked(false);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 429) {
          setIsLocked(true);
          setError(
            data.error ||
              "Account is temporarily locked due to consecutive failed attempts. Please wait before trying again."
          );
        } else {
          setError(data.error || "Invalid username/email or password.");
        }
      } else {
        router.push(redirect);
        router.refresh();
      }
    } catch {
      setError("Network connection error. Please verify your internet connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-slate-200/80 shadow-md dark:border-slate-800">
      <CardHeader className="space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 text-white shadow-sm">
          <Camera className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          Instagramer
        </CardTitle>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Enter your credentials to access your feed and profile
        </p>
      </CardHeader>

      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="space-y-4">
          {wasRegistered && !error && (
            <div
              className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
              role="status"
            >
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>Account created successfully. You can now sign in below.</span>
            </div>
          )}

          {error && (
            <div
              className={`flex items-start gap-2.5 rounded-lg border p-3 text-xs ${
                isLocked
                  ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                  : "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
              }`}
              role="alert"
              aria-live="assertive"
            >
              {isLocked ? (
                <Clock className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
              )}
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <Input
            id="login-identifier"
            label="Username or Email"
            type="text"
            autoComplete="username"
            placeholder="Enter your username or email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            disabled={loading}
          />

          <Input
            id="login-password"
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />

          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/70 p-2.5 text-[11px] text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>Secured with Argon2id encryption & HTTP-only sessions</span>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3.5">
          <Button
            type="submit"
            className="w-full font-semibold shadow-sm"
            disabled={loading || !identifier.trim() || !password}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Signing in...</span>
              </span>
            ) : (
              "Log In"
            )}
          </Button>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              Sign Up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
};
