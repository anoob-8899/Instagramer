"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  FileText,
  MessageSquare,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Activity,
  ArrowRight,
  RefreshCw,
  Heart,
  UserCheck,
  Lock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface StatsData {
  metrics: {
    users: {
      total: number;
      active: number;
      suspended: number;
      admins: number;
      moderators: number;
    };
    content: {
      posts: number;
      comments: number;
      likes: number;
      follows: number;
    };
    messaging: {
      conversations: number;
      messages: number;
    };
    moderation: {
      pendingReports: number;
      totalReports: number;
    };
    security: {
      recent24hAuditCount: number;
    };
  };
  recentAuditEvents: Array<{
    id: string;
    action: string;
    actorId: string | null;
    metadata: string | null;
    createdAt: string;
  }>;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/stats");
      if (!res.ok) {
        throw new Error("Failed to load statistics");
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Activity className="h-6 w-6 text-red-500" />
            Security & Administration Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time platform telemetry, user metrics, content moderation, and audit monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-1 text-xs bg-slate-800 text-slate-200 hover:bg-slate-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Badge variant="outline" className="border-red-800 text-red-400 bg-red-950/40">
            Admin Console (CON 07)
          </Badge>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/40 p-4 text-xs text-red-300 flex items-center justify-between">
          <span>{error}</span>
          <Button size="sm" variant="ghost" onClick={fetchStats} className="text-red-400 hover:bg-red-900/50">
            Retry
          </Button>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}
        <Card className="border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-mono text-slate-400 uppercase">Platform Users</CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">
              {loading ? "..." : data?.metrics.users.total ?? 0}
            </div>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
              <span className="text-emerald-400 font-medium">
                {data?.metrics.users.active ?? 0} Active
              </span>
              <span>•</span>
              <span className="text-red-400 font-medium">
                {data?.metrics.users.suspended ?? 0} Suspended
              </span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              {data?.metrics.users.admins ?? 0} Admins | {data?.metrics.users.moderators ?? 0} Mods
            </div>
            <Link
              href="/admin/users"
              className="mt-3 flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300"
            >
              Manage Users <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Content & Social */}
        <Card className="border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-mono text-slate-400 uppercase">Content & Posts</CardTitle>
            <FileText className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">
              {loading ? "..." : data?.metrics.content.posts ?? 0}
            </div>
            <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
              <span>{data?.metrics.content.comments ?? 0} Comments</span>
              <span>•</span>
              <span>{data?.metrics.content.likes ?? 0} Likes</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              {data?.metrics.content.follows ?? 0} Social Follows
            </div>
            <Link
              href="/admin/posts"
              className="mt-3 flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300"
            >
              Moderate Content <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Moderation Queue */}
        <Card className="border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-mono text-slate-400 uppercase">Moderation Queue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-400">
              {loading ? "..." : data?.metrics.moderation.pendingReports ?? 0}
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              <span>Pending user reports awaiting review</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              Total reports submitted: {data?.metrics.moderation.totalReports ?? 0}
            </div>
            <Link
              href="/admin/reports"
              className="mt-3 flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300"
            >
              Review Reports <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Messaging & Security */}
        <Card className="border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-mono text-slate-400 uppercase">Direct Messaging</CardTitle>
            <MessageSquare className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">
              {loading ? "..." : data?.metrics.messaging.conversations ?? 0}
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              <span>{data?.metrics.messaging.messages ?? 0} Total E2EE Messages</span>
            </div>
            <div className="mt-1 text-[11px] text-emerald-400 font-mono flex items-center gap-1">
              <Lock className="h-3 w-3" /> E2EE Cryptographic Boundary Active
            </div>
            <Link
              href="/admin/security"
              className="mt-3 flex items-center gap-1 text-xs font-medium text-purple-400 hover:text-purple-300"
            >
              Security Telemetry <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation & System Status */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* System & Database Status */}
        <Card className="border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Infrastructure & Database
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Database Engine</span>
              <span className="font-mono text-slate-200">Neon PostgreSQL</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">ORM / Client</span>
              <span className="font-mono text-slate-200">Prisma Client 6.x</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Password Hashing</span>
              <span className="font-mono text-slate-200">Argon2id (Memory-Hard)</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Account Lockout</span>
              <span className="font-mono text-slate-200">5 attempts / 15m lock</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400">Session Security</span>
              <span className="font-mono text-slate-200">HTTP-Only Lax Cookies</span>
            </div>
          </CardContent>
        </Card>

        {/* Security & Audit Events Feed */}
        <Card className="border-slate-800 bg-slate-900 text-slate-100 md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-red-400" />
              Recent Audit Log Activity
            </CardTitle>
            <Link
              href="/admin/audit-logs"
              className="text-xs font-medium text-red-400 hover:text-red-300 flex items-center gap-1"
            >
              Full Trail <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-6 text-center text-xs text-slate-500">Loading audit activity...</div>
            ) : !data?.recentAuditEvents || data.recentAuditEvents.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">No recent audit events recorded.</div>
            ) : (
              <div className="divide-y divide-slate-800">
                {data.recentAuditEvents.map((evt) => (
                  <div key={evt.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="font-mono font-medium text-slate-200 flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 border-slate-700 bg-slate-800 text-slate-300"
                        >
                          {evt.action}
                        </Badge>
                        {evt.actorId && (
                          <span className="text-[11px] text-slate-400">Actor: {evt.actorId.slice(0, 8)}...</span>
                        )}
                      </div>
                      {evt.metadata && (
                        <p className="text-[11px] text-slate-400 font-mono truncate max-w-md">
                          {evt.metadata}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 whitespace-nowrap ml-4">
                      {new Date(evt.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
