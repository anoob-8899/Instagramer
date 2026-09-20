"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Key,
  Database,
  Activity,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Cpu,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface SecurityData {
  config: {
    maxLoginAttempts: number;
    lockoutDurationMinutes: number;
    sessionTtlHours: number;
    minPasswordLength: number;
    cookieName: string;
  };
  modules: Record<string, { name: string; status: string }>;
  telemetry: {
    currentlyLockedCount: number;
    lockedUsers: Array<{
      id: string;
      username: string;
      email: string;
      role: string;
      failedLoginAttempts: number;
      lockedUntil: string;
      remainingMinutes: number;
    }>;
  };
  recentSecurityEvents: Array<{
    id: string;
    action: string;
    actorId: string | null;
    metadata: string | null;
    createdAt: string;
  }>;
}

export default function AdminSecurityPage() {
  const [data, setData] = useState<SecurityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [unlockLoadingId, setUnlockLoadingId] = useState<string | null>(null);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/security");
      if (!res.ok) {
        throw new Error("Failed to load security telemetry");
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Failed to load security telemetry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const handleUnlockUser = async (userId: string, username: string) => {
    try {
      setUnlockLoadingId(userId);
      setError(null);
      setSuccessMsg(null);

      const res = await fetch("/api/admin/security/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to unlock account");

      setSuccessMsg(json.message || `Account for @${username} unlocked successfully.`);
      fetchSecurityData();
    } catch (err: any) {
      setError(err.message || "Failed to unlock account");
    } finally {
      setUnlockLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-500" />
            Security Center & Threat Monitoring
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time security telemetry, brute-force lockout management, and cryptographic lab
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={fetchSecurityData}
            disabled={loading}
            className="text-xs bg-slate-800 text-slate-200 hover:bg-slate-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Badge variant="outline" className="border-emerald-800 text-emerald-400 bg-emerald-950/40">
            Security Status: Green
          </Badge>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/50 p-3 text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="rounded-lg border border-emerald-800 bg-emerald-950/50 p-3 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Security Policies & Module Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Security Parameters */}
        <Card className="border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader>
            <CardTitle className="text-xs font-mono uppercase text-slate-400 flex items-center gap-2">
              <Lock className="h-4 w-4 text-blue-400" /> Active Security Policies
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Max Failed Attempts</span>
              <span className="font-mono text-slate-200 font-bold">{data?.config.maxLoginAttempts ?? 5} attempts</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Lockout Duration</span>
              <span className="font-mono text-slate-200 font-bold">{data?.config.lockoutDurationMinutes ?? 15} minutes</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Session Expiration</span>
              <span className="font-mono text-slate-200 font-bold">{data?.config.sessionTtlHours ?? 24} hours</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400">Min Password Length</span>
              <span className="font-mono text-slate-200 font-bold">{data?.config.minPasswordLength ?? 8} characters</span>
            </div>
          </CardContent>
        </Card>

        {/* Full Security Laboratory Master Card */}
        <Card className="border-indigo-800 bg-indigo-950/30 text-slate-100 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-mono uppercase text-indigo-300 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" /> Security Laboratory
            </CardTitle>
            <Badge variant="outline" className="border-emerald-700 bg-emerald-950/60 text-emerald-300 text-[10px]">
              CON 09 Lab
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <p className="text-slate-300">
              Interactive classroom demonstration of Argon2id hashing, verification, account lockout, session token hashing, audit sanitization, and E2EE privacy boundaries.
            </p>
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-emerald-400 font-mono">
                ● Simulation Mode
              </span>
              <Link
                href="/admin/security/lab"
                className="inline-flex items-center gap-1 text-xs font-medium text-indigo-300 hover:text-indigo-200"
              >
                Open Security Lab <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* E2EE Cryptographic Lab Banner */}
        <Card className="border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-mono uppercase text-slate-400 flex items-center gap-2">
              <Key className="h-4 w-4 text-purple-400" /> E2EE Cryptographic Lab
            </CardTitle>
            <Badge variant="outline" className="border-purple-800 bg-purple-950/40 text-purple-400 text-[10px]">
              ECDH + AES-GCM
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <p className="text-slate-300">
              Direct messaging uses client-side End-to-End Encryption with ECDH P-256 and AES-256-GCM authenticated encryption.
            </p>
            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500 font-mono">
                Zero Plaintext
              </span>
              <Link
                href="/admin/security/messaging-demo"
                className="inline-flex items-center gap-1 text-xs font-medium text-purple-400 hover:text-purple-300"
              >
                Open E2EE Sandbox <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Locked Accounts Management */}
      <Card className="border-slate-800 bg-slate-900 text-slate-100 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-400" /> Currently Locked Accounts (Brute-Force Protection)
            </CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              Accounts temporarily locked due to repeated authentication failures
            </p>
          </div>
          <Badge
            variant="outline"
            className={`text-xs ${
              (data?.telemetry.currentlyLockedCount ?? 0) > 0
                ? "border-amber-800 bg-amber-950/60 text-amber-400"
                : "border-emerald-800 bg-emerald-950/60 text-emerald-400"
            }`}
          >
            {data?.telemetry.currentlyLockedCount ?? 0} Accounts Locked
          </Badge>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-mono text-[10px]">
                <th className="p-3.5">User</th>
                <th className="p-3.5">Email</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Failed Attempts</th>
                <th className="p-3.5">Time Remaining</th>
                <th className="p-3.5 text-right">Admin Unlock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    Checking account lockout telemetry...
                  </td>
                </tr>
              ) : !data?.telemetry.lockedUsers || data.telemetry.lockedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-400">
                    <span className="text-emerald-400 font-semibold">✓ All accounts healthy.</span> No users currently
                    locked out.
                  </td>
                </tr>
              ) : (
                data.telemetry.lockedUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3.5 font-semibold text-slate-100">@{u.username}</td>
                    <td className="p-3.5 font-mono text-slate-300">{u.email}</td>
                    <td className="p-3.5">
                      <Badge variant="outline" className="text-[10px]">
                        {u.role}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-red-400 font-bold font-mono">{u.failedLoginAttempts} failed</td>
                    <td className="p-3.5 text-amber-400 font-mono">~{u.remainingMinutes} min left</td>
                    <td className="p-3.5 text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleUnlockUser(u.id, u.username)}
                        disabled={unlockLoadingId === u.id}
                        className="h-7 px-2 text-xs bg-amber-950 text-amber-400 border border-amber-800 hover:bg-amber-900"
                      >
                        <Unlock className="h-3.5 w-3.5 mr-1" />
                        {unlockLoadingId === u.id ? "Unlocking..." : "Unlock Account"}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent Security Telemetry Audit Feed */}
      <Card className="border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-400" /> Recent Security & Authentication Events
          </CardTitle>
          <Link
            href="/admin/audit-logs"
            className="text-xs text-blue-400 hover:text-blue-300 font-medium"
          >
            View Full Trail →
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-800/60 font-mono text-xs">
            {loading ? (
              <div className="p-6 text-center text-slate-500">Loading security feed...</div>
            ) : !data?.recentSecurityEvents || data.recentSecurityEvents.length === 0 ? (
              <div className="p-6 text-center text-slate-500">No security events logged recently.</div>
            ) : (
              data.recentSecurityEvents.map((evt) => (
                <div key={evt.id} className="p-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        evt.action.includes("FAILURE") || evt.action.includes("LOCKED") || evt.action.includes("BLOCKED")
                          ? "border-red-800 bg-red-950/60 text-red-400"
                          : evt.action.includes("ROLE") || evt.action.includes("SUSPENDED")
                          ? "border-amber-800 bg-amber-950/60 text-amber-400"
                          : "border-emerald-800 bg-emerald-950/60 text-emerald-400"
                      }`}
                    >
                      {evt.action}
                    </Badge>
                    <span className="text-slate-400 text-[11px] truncate max-w-md">
                      {evt.metadata ? evt.metadata : "—"}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 whitespace-nowrap">
                    {new Date(evt.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
