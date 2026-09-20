"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  PlusSquare,
  MessageCircle,
  Bell,
  User,
  Settings,
  Shield,
  LogOut,
  Camera,
  Loader2,
} from "lucide-react";
import { clsx } from "clsx";

export interface NavUserState {
  username: string;
  email: string;
  role: string;
  displayName?: string | null;
  avatarUrl?: string | null;
}

export interface DesktopNavProps {
  currentUser: NavUserState | null;
  unreadNotificationsCount?: number;
  onLogout: () => Promise<void>;
  isLoggingOut?: boolean;
}

export const DesktopNav: React.FC<DesktopNavProps> = ({
  currentUser,
  unreadNotificationsCount = 0,
  onLogout,
  isLoggingOut = false,
}) => {
  const pathname = usePathname();

  const userProfileHref = currentUser?.username
    ? `/profile/${currentUser.username}`
    : "/login";

  const navItems = [
    { label: "Home", href: "/feed", icon: Home },
    { label: "Search", href: "/feed?search=open", icon: Search, badge: "Explore" },
    { label: "Create", href: "/create", icon: PlusSquare },
    { label: "Messages", href: "/messages", icon: MessageCircle },
    {
      label: "Notifications",
      href: "/notifications",
      icon: Bell,
      notificationCount: unreadNotificationsCount,
    },
    { label: "Profile", href: userProfileHref, icon: User },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside
      className="hidden w-64 flex-col border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:flex select-none"
      aria-label="Desktop Navigation"
    >
      {/* Brand Identity */}
      <div className="mb-6 px-3 py-2">
        <Link
          href="/feed"
          className="group flex items-center gap-2.5 text-2xl font-black tracking-tight text-slate-900 dark:text-white"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 text-white shadow-sm transition-transform duration-200 group-hover:scale-105 motion-reduce:transition-none">
            <Camera className="h-5 w-5" />
          </div>
          <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent dark:from-white dark:to-slate-300">
            Instagramer
          </span>
        </Link>
        <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
          Modern Social Experience
        </p>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 space-y-1.5" aria-label="Main Menu">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href.startsWith("/profile") && pathname.startsWith("/profile"));

          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={clsx(
                "group flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-150 motion-reduce:transition-none",
                isActive
                  ? "bg-blue-50/80 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 font-bold"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white"
              )}
            >
              <div className="flex items-center gap-3.5">
                <Icon
                  className={clsx(
                    "h-5 w-5 transition-transform duration-150 group-hover:scale-110 motion-reduce:transition-none",
                    isActive ? "text-blue-600 dark:text-blue-400 stroke-[2.5]" : "stroke-2"
                  )}
                />
                <span>{item.label}</span>
              </div>
              {item.notificationCount !== undefined && item.notificationCount > 0 ? (
                <span
                  className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm animate-in fade-in"
                  aria-label={`${item.notificationCount} unread notifications`}
                >
                  {item.notificationCount > 99 ? "99+" : item.notificationCount}
                </span>
              ) : item.badge ? (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* User Status & Admin Controls */}
      <div className="border-t border-slate-200 pt-4 space-y-2 dark:border-slate-800">
        {currentUser?.role === "ADMIN" && (
          <Link
            href="/admin"
            className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors"
          >
            <Shield className="h-4 w-4 shrink-0" />
            <span>Admin Console</span>
          </Link>
        )}

        {currentUser ? (
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/50">
            <Link
              href={`/profile/${currentUser.username}`}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-xs font-bold text-white uppercase shadow-sm">
                {currentUser.displayName
                  ? currentUser.displayName.slice(0, 2)
                  : currentUser.username.slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {currentUser.displayName || currentUser.username}
                </p>
                <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                  @{currentUser.username}
                </p>
              </div>
            </Link>

            <button
              onClick={onLogout}
              disabled={isLoggingOut}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Signing out...</span>
                </>
              ) : (
                <>
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Link
              href="/login"
              className="flex w-full items-center justify-center rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white hover:bg-blue-700 transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="flex w-full items-center justify-center rounded-xl border border-slate-300 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
};
