"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/Card";
import { AlertCircle, ShieldCheck, Camera, Loader2, CheckCircle2 } from "lucide-react";

export const SignupForm: React.FC = () => {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [clientErrors, setClientErrors] = useState<{
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validateClient = (): boolean => {
    const errors: {
      username?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    const cleanUsername = username.trim();
    const cleanEmail = email.trim();

    if (!cleanUsername) {
      errors.username = "Username is required.";
    } else if (!/^[a-zA-Z0-9_]{3,30}$/.test(cleanUsername)) {
      errors.username = "Username must be 3-30 characters (letters, numbers, underscores).";
    }

    if (!cleanEmail) {
      errors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errors.email = "Please enter a valid email address.";
    }

    if (!password) {
      errors.password = "Password is required.";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters long.";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Confirm password is required.";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    setClientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validateClient()) {
      return;
    }

    setLoading(true);

    try {
      // 1. Submit registration
      const regRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password,
        }),
      });

      const regData = await regRes.json().catch(() => ({}));

      if (!regRes.ok) {
        setServerError(regData.error || "Registration failed. Please check your details.");
        setLoading(false);
        return;
      }

      // 2. Automatically log in after registration to initialize session
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: username.trim(),
          password,
        }),
      });

      if (loginRes.ok) {
        router.push("/feed");
        router.refresh();
      } else {
        router.push("/login?registered=true");
      }
    } catch {
      setServerError("Network error occurred during sign up. Please try again.");
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
          Join Instagramer
        </CardTitle>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Sign up to share moments and connect with friends
        </p>
      </CardHeader>

      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="space-y-4">
          {serverError && (
            <div
              className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
              role="alert"
              aria-live="assertive"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
              <span className="leading-relaxed">{serverError}</span>
            </div>
          )}

          <Input
            id="signup-username"
            label="Username"
            type="text"
            autoComplete="username"
            placeholder="e.g. alex_rivera"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (clientErrors.username) {
                setClientErrors((prev) => ({ ...prev, username: undefined }));
              }
            }}
            error={clientErrors.username}
            required
            disabled={loading}
          />

          <Input
            id="signup-email"
            label="Email Address"
            type="email"
            autoComplete="email"
            placeholder="e.g. alex@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (clientErrors.email) {
                setClientErrors((prev) => ({ ...prev, email: undefined }));
              }
            }}
            error={clientErrors.email}
            required
            disabled={loading}
          />

          <Input
            id="signup-password"
            label="Password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (clientErrors.password) {
                setClientErrors((prev) => ({ ...prev, password: undefined }));
              }
            }}
            error={clientErrors.password}
            helperText="Must be at least 8 characters long"
            required
            disabled={loading}
          />

          <Input
            id="signup-confirm-password"
            label="Confirm Password"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat your password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (clientErrors.confirmPassword) {
                setClientErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }
            }}
            error={clientErrors.confirmPassword}
            required
            disabled={loading}
          />

          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/70 p-2.5 text-[11px] text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>Profile and authentication credentials secured automatically</span>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3.5">
          <Button
            type="submit"
            className="w-full font-semibold shadow-sm"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creating Account...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Create Account</span>
              </span>
            )}
          </Button>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              Sign In
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
};
