"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusSquare, MessageCircle, Bell, User, Settings, Shield } from "lucide-react";
import { clsx } from "clsx";

export interface UserShellProps {
  children: React.ReactNode;
}

export const UserShell: React.FC<UserShellProps> = ({ children }) => {
  const pathname = usePathname();

  const navItems = [
    { label: "Feed", href: "/feed", icon: Home },
    { label: "Create", href: "/create", icon: PlusSquare },
    { label: "Messages", href: "/messages", icon: MessageCircle },
    { label: "Notifications", href: "/notifications", icon: Bell },
    { label: "Profile", href: "/profile/cyber_student", icon: User },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950 md:flex-row">
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:flex">
        <div className="mb-8 px-4 py-2">
          <Link href="/feed" className="text-2xl font-black tracking-tight text-blue-600 dark:text-blue-400">
            Instagramer
          </Link>
        </div>
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href.startsWith("/profile") && pathname.startsWith("/profile"));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
          <Link
            href="/admin"
            className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <Shield className="h-4 w-4" />
            <span>Admin Console</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-8 md:pb-8">
        <div className="mx-auto max-w-4xl">{children}</div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-slate-200 bg-white/95 px-2 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href.startsWith("/profile") && pathname.startsWith("/profile"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex flex-col items-center gap-1 rounded-md p-2 text-xs font-medium transition-colors",
                isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-600 dark:text-slate-400"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
