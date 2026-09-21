"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Shield, Users, FileText, AlertTriangle, ShieldCheck, Activity, ArrowLeft, LogOut, Cpu } from "lucide-react";
import { clsx } from "clsx";
import { ClassroomBanner } from "@/components/layout/ClassroomBanner";

export interface AdminShellProps {
  children: React.ReactNode;
}

export interface AdminUserState {
  username: string;
  email: string;
  role: string;
}

export const AdminShell: React.FC<AdminShellProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AdminUserState | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setCurrentUser({
            username: data.user.username,
            email: data.user.email,
            role: data.user.role,
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  const adminNavItems = [
    { label: "Dashboard", href: "/admin", icon: Activity },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Posts", href: "/admin/posts", icon: FileText },
    { label: "Reports", href: "/admin/reports", icon: AlertTriangle },
    { label: "Security", href: "/admin/security", icon: ShieldCheck },
    { label: "Security Lab", href: "/admin/security/lab", icon: Cpu },
    { label: "Audit Logs", href: "/admin/audit-logs", icon: Shield },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <ClassroomBanner />
      <div className="flex flex-1 min-w-0">
        {/* Admin Sidebar Navigation */}
        <aside className="w-64 flex-col border-r border-slate-800 bg-slate-900 p-4 hidden md:flex">
          <div className="mb-6 flex items-center justify-between px-3 py-2 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-red-500" />
              <span className="font-bold tracking-wider uppercase text-slate-100 text-sm">
                Admin Ops
              </span>
            </div>
            <span className="rounded bg-red-950 px-2 py-0.5 text-[10px] font-mono text-red-400 border border-red-800">
              CON 07
            </span>
          </div>

          <nav className="flex-1 space-y-1">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-slate-800 text-red-400 border-l-2 border-red-500"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-800 pt-4 space-y-1">
            <Link
              href="/feed"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Return to App Shell</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-400 hover:bg-slate-800 hover:text-red-400"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-slate-800 bg-slate-900/60 px-6 flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase text-slate-400 tracking-wider">
              Instagramer Administration & Security Center
              {currentUser && (
                <span className="ml-3 text-red-400 font-normal">
                  | Admin: @{currentUser.username}
                </span>
              )}
            </h2>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono text-emerald-400">System Online (Neon DB Connected)</span>
            </div>
          </header>

          {/* Mobile Subnav for Admin */}
          <div className="flex overflow-x-auto border-b border-slate-800 bg-slate-900 px-4 py-2 md:hidden gap-2">
            {adminNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "whitespace-nowrap px-3 py-1 rounded text-xs font-medium",
                  pathname === item.href ? "bg-red-950 text-red-400 border border-red-800" : "text-slate-400 bg-slate-800/40"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <main className="flex-1 p-6 overflow-y-auto">{children}</main>
        </div>
      </div>
    </div>
  );
};
