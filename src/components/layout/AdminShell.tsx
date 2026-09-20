"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Users, FileText, AlertTriangle, ShieldCheck, Activity, ArrowLeft } from "lucide-react";
import { clsx } from "clsx";

export interface AdminShellProps {
  children: React.ReactNode;
}

export const AdminShell: React.FC<AdminShellProps> = ({ children }) => {
  const pathname = usePathname();

  const adminNavItems = [
    { label: "Dashboard", href: "/admin", icon: Activity },
    { label: "Users", href: "/admin/users", icon: Users },
    { label: "Posts", href: "/admin/posts", icon: FileText },
    { label: "Reports", href: "/admin/reports", icon: AlertTriangle },
    { label: "Security", href: "/admin/security", icon: ShieldCheck },
    { label: "Audit Logs", href: "/admin/audit-logs", icon: Shield },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
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
            CON 01
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

        <div className="border-t border-slate-800 pt-4">
          <Link
            href="/feed"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to App Shell</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-slate-800 bg-slate-900/60 px-6 flex items-center justify-between">
          <h2 className="text-xs font-mono uppercase text-slate-400 tracking-wider">
            Instagramer Administration & Security Center
          </h2>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono text-emerald-400">System Ready (Disconnected DB)</span>
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
  );
};
