"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/Card";
import { AlertCircle, ShieldCheck, Camera, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";

export const SignupForm: React.FC = () => {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [clientErrors, setClientErrors] = useState<{
    username?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validateClient = (): boolean => {
    const errors: {
      username?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    const cleanUsername = username.trim();

    if (!cleanUsername) {
      errors.username = "Username is required.";
    } else if (!/^[a-zA-Z0-9_]{3,30}$/.test(cleanUsername)) {
      errors.username = "Username must be 3-30 characters (letters, numbers, underscores).";
    }

    if (!password) {
      errors.password = "Password is required.";
    } else if (!/^[0-9]{6}$/.test(password)) {
      errors.password = "Password must contain exactly 6 digits.";
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
          password,
          confirmPassword,
        }),
      });

      const regData = await regRes.json().catch(() => ({}));

      if (!regRes.ok) {
        setServerError(regData.error || "Registration failed. Please check your details.");
        setLoading(false);
        return;
      }

      // 2. Automatically log in after registration
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
          Sign up with your Username and 6-digit PIN code
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
            placeholder="e.g. student_demo_01"
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

          {/* Password with Show/Hide Toggle */}
          <div className="space-y-1.5">
            <label htmlFor="signup-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Password (6 Digits)
            </label>
            <div className="relative">
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••"
                maxLength={6}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (clientErrors.password) {
                    setClientErrors((prev) => ({ ...prev, password: undefined }));
                  }
                }}
                required
                disabled={loading}
                className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 font-mono tracking-widest"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {clientErrors.password && <p className="text-xs text-red-500">{clientErrors.password}</p>}
            {!clientErrors.password && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Must be exactly 6 numeric digits (000000–999999)</p>
            )}
          </div>

          {/* Confirm Password with Show/Hide Toggle */}
          <div className="space-y-1.5">
            <label htmlFor="signup-confirm-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="signup-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••"
                maxLength={6}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (clientErrors.confirmPassword) {
                    setClientErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                  }
                }}
                required
                disabled={loading}
                className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 font-mono tracking-widest"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {clientErrors.confirmPassword && <p className="text-xs text-red-500">{clientErrors.confirmPassword}</p>}
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/70 p-2.5 text-[11px] text-slate-600 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>Secured automatically with server-side Argon2id password hashing</span>
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
