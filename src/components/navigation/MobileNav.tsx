"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  PlusSquare,
  Bell,
  User,
  MessageCircle,
  Camera,
  LogOut,
} from "lucide-react";
import { clsx } from "clsx";
import { NavUserState } from "./DesktopNav";

export interface MobileNavProps {
  currentUser: NavUserState | null;
  unreadNotificationsCount?: number;
  onLogout: () => Promise<void>;
  isLoggingOut?: boolean;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentUser,
  unreadNotificationsCount = 0,
  onLogout,
  isLoggingOut = false,
}) => {
  const pathname = usePathname();

  const userProfileHref = currentUser?.username
    ? `/profile/${currentUser.username}`
    : "/login";

  const mobileNavItems = [
    { label: "Home", href: "/feed", icon: Home },
    { label: "Search", href: "/feed?search=open", icon: Search },
    { label: "Create", href: "/create", icon: PlusSquare },
    {
      label: "Notifications",
      href: "/notifications",
      icon: Bell,
      notificationCount: unreadNotificationsCount,
    },
    { label: "Profile", href: userProfileHref, icon: User },
  ];

  return (
    <>
      {/* Mobile Top App Bar */}
      <header
        className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 md:hidden"
        aria-label="Mobile Header"
      >
        <Link href="/feed" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 text-white shadow-sm">
            <Camera className="h-4 w-4" />
          </div>
          <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
            Instagramer
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/messages"
            aria-label="Messages"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <MessageCircle className="h-5 w-5" />
          </Link>
          {currentUser && (
            <button
              onClick={onLogout}
              disabled={isLoggingOut}
              aria-label="Sign Out"
              title="Sign Out"
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-slate-200 bg-white/95 px-2 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 md:hidden"
        aria-label="Mobile Bottom Navigation"
      >
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href.startsWith("/profile") && pathname.startsWith("/profile"));

          return (
            <Link
              key={item.label}
              href={item.href}
              aria-label={
                item.notificationCount && item.notificationCount > 0
                  ? `${item.label}, ${item.notificationCount} unread`
                  : item.label
              }
              aria-current={isActive ? "page" : undefined}
              className={clsx(
                "relative flex flex-1 flex-col items-center justify-center py-1 transition-colors motion-reduce:transition-none",
                isActive
                  ? "text-blue-600 dark:text-blue-400 font-bold"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              <div className="relative">
                <Icon
                  className={clsx(
                    "h-5 w-5 transition-transform motion-reduce:transition-none",
                    isActive ? "scale-110 stroke-[2.5]" : "stroke-2"
                  )}
                />
                {item.notificationCount !== undefined && item.notificationCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-sm">
                    {item.notificationCount > 99 ? "99+" : item.notificationCount}
                  </span>
                )}
              </div>
              <span className="mt-0.5 text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
};
