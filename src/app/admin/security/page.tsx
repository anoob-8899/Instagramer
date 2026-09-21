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
  Server,
  Layers,
  Eye,
  EyeOff,
  UserCheck,
  Radio,
  Sliders,
  Terminal,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface SecuritySettings {
  rateLimitingEnabled: boolean;
  accountLockoutEnabled: boolean;
  classroomModeEnabled: boolean;
  messageSecurityEnabled: boolean;
  messageRepresentation: "PROTECTED" | "SIMULATED_EXPOSED";
  maxFailedAttempts: number;
  lockoutDurationSeconds: number;
  rateLimitWindowSeconds: number;
  rateLimitMaxAttempts: number;
}

interface AccountInspectorItem {
  id: string;
  username: string;
  email: string | null;
  role: string;
  status: string;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  isLocked: boolean;
  remainingMinutes: number;
  passwordFormat: string;
  hashPresent: boolean;
  hashAlgorithm: string;
  plaintextAccess: string;
  lockoutStatus: string;
  rateLimitStatus: string;
  messageSecurityStatus: string;
}

interface SecurityEventItem {
  id: string;
  eventType: string;
  username: string | null;
  userId: string | null;
  success: boolean;
  metadata: string | null;
  createdAt: string;
}

export default function AdminSecurityPage() {
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [accounts, setAccounts] = useState<AccountInspectorItem[]>([]);
  const [events, setEvents] = useState<SecurityEventItem[]>([]);
  const [environment, setEnvironment] = useState<Record<string, string>>({});
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [unlockLoadingId, setUnlockLoadingId] = useState<string | null>(null);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/admin/security");
      if (!res.ok) throw new Error("Failed to load security telemetry");
      const data = await res.json();
      setSettings(data.settings);
      setAccounts(data.accounts || []);
      setEvents(data.events || []);
      setEnvironment(data.environment || {});
      if (data.accounts?.length > 0 && !selectedAccountId) {
        setSelectedAccountId(data.accounts[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load security data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const handleToggleSetting = async (key: keyof SecuritySettings, val: any) => {
    try {
      setUpdating(true);
      setError(null);
      setSuccessMsg(null);

      const res = await fetch("/api/admin/security/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: val }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update security control");

      setSettings(data.settings);
      setSuccessMsg("Security control updated successfully.");
      fetchSecurityData();
    } catch (err: any) {
      setError(err.message || "Failed to update security control");
    } finally {
      setUpdating(false);
    }
  };

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

      setSuccessMsg(json.message || `Account for @${username} unlocked.`);
      fetchSecurityData();
    } catch (err: any) {
      setError(err.message || "Failed to unlock account");
    } finally {
      setUnlockLoadingId(null);
    }
  };

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];

  const getEventTag = (type: string) => {
    if (type.startsWith("LOGIN")) return "[AUTH]";
    return "[SECURITY]";
  };

  const formatEventName = (type: string) => {
    switch (type) {
      case "LOGIN_ATTEMPT":
        return "Login attempt";
      case "LOGIN_SUCCESS":
        return "Login successful";
      case "LOGIN_FAILURE":
        return "Login failed";
      case "ACCOUNT_LOCKED":
        return "Account temporarily locked";
      case "RATE_LIMIT_TRIGGERED":
        return "Rate limit triggered";
      case "PASSWORD_CHANGED":
        return "Password hash verified";
      case "CLASSROOM_MODE_ENABLED":
        return "Classroom demonstration mode enabled";
      case "CLASSROOM_MODE_DISABLED":
        return "Classroom demonstration mode disabled";
      case "SECURITY_SETTING_CHANGED":
        return "Security setting changed";
      default:
        return type.toLowerCase().replace(/_/g, " ");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <ShieldCheck className="h-7 w-7 text-emerald-500" />
            SECURITY CONTROL CENTER
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time cybersecurity controls, threat telemetry, and authorized classroom demonstration management
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="secondary"
            onClick={fetchSecurityData}
            disabled={loading}
            className="text-xs bg-slate-800 text-slate-200 hover:bg-slate-700 flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Telemetry
          </Button>
          <Badge
            variant="outline"
            className={`text-xs px-3 py-1 font-mono ${
              settings?.classroomModeEnabled
                ? "border-amber-700 bg-amber-950/60 text-amber-400"
                : "border-emerald-800 bg-emerald-950/60 text-emerald-400"
            }`}
          >
            {settings?.classroomModeEnabled ? "● CLASSROOM DEMO MODE" : "● PROTECTED MODE"}
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

      {/* CLASSROOM CYBERSECURITY MODE MASTER CONTROL */}
      <Card className="border-amber-700/80 bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 text-slate-100 shadow-md">
        <CardHeader className="py-3 px-5 border-b border-amber-900/50 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-mono uppercase text-amber-400 flex items-center gap-2">
            <Radio className="h-4 w-4 text-amber-400 animate-pulse" /> CLASSROOM CYBERSECURITY MODE
          </CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-300">
              State: <strong className={settings?.classroomModeEnabled ? "text-amber-400" : "text-slate-400"}>
                {settings?.classroomModeEnabled ? "ON" : "OFF"}
              </strong>
            </span>
            <button
              onClick={() => handleToggleSetting("classroomModeEnabled", !settings?.classroomModeEnabled)}
              disabled={updating}
              className={`px-3 py-1 rounded text-xs font-bold font-mono transition-colors ${
                settings?.classroomModeEnabled
                  ? "bg-amber-500 text-amber-950 hover:bg-amber-400"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {settings?.classroomModeEnabled ? "[ TURN OFF ]" : "[ TURN ON ]"}
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-4 text-xs text-slate-300 space-y-2">
          <p>
            When enabled, Instagramer displays the persistent header banner{" "}
            <span className="font-mono text-amber-400 font-bold">AUTHORIZED CLASSROOM SECURITY DEMONSTRATION</span>{" "}
            across all pages and unlocks detailed security status controls for demonstration.
          </p>
        </CardContent>
      </Card>

      {/* FOUR SECURITY-CONTROL PANELS */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* PANEL 1: AUTHENTICATION */}
        <Card className="border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader className="py-3 border-b border-slate-800 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-mono uppercase text-slate-300 flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-blue-400" /> AUTHENTICATION
            </CardTitle>
            <Badge
              variant="outline"
              className={`text-[10px] ${
                settings?.accountLockoutEnabled && settings?.rateLimitingEnabled
                  ? "border-emerald-800 text-emerald-400 bg-emerald-950/40"
                  : "border-amber-800 text-amber-400 bg-amber-950/40"
              }`}
            >
              {settings?.accountLockoutEnabled && settings?.rateLimitingEnabled ? "PROTECTED MODE" : "VULNERABLE DEMO MODE"}
            </Badge>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Account Lockout</span>
              <button
                onClick={() => handleToggleSetting("accountLockoutEnabled", !settings?.accountLockoutEnabled)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                  settings?.accountLockoutEnabled
                    ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                    : "bg-amber-950 text-amber-400 border border-amber-800"
                }`}
              >
                {settings?.accountLockoutEnabled ? "ENABLED" : "DISABLED"}
              </button>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Rate Limiting</span>
              <button
                onClick={() => handleToggleSetting("rateLimitingEnabled", !settings?.rateLimitingEnabled)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                  settings?.rateLimitingEnabled
                    ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                    : "bg-amber-950 text-amber-400 border border-amber-800"
                }`}
              >
                {settings?.rateLimitingEnabled ? "ENABLED" : "DISABLED"}
              </button>
            </div>
            <div className="pt-1 text-[11px] text-slate-400 space-y-1 font-mono">
              <div className="flex justify-between">
                <span>Lockout Threshold:</span>
                <span className="text-slate-200 font-bold">{settings?.maxFailedAttempts ?? 5} attempts</span>
              </div>
              <div className="flex justify-between">
                <span>Lockout Duration:</span>
                <span className="text-slate-200 font-bold">{Math.round((settings?.lockoutDurationSeconds ?? 900) / 60)} minutes</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PANEL 2: PASSWORD SECURITY */}
        <Card className="border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader className="py-3 border-b border-slate-800 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-mono uppercase text-slate-300 flex items-center gap-1.5">
              <Key className="h-4 w-4 text-purple-400" /> PASSWORD SECURITY
            </CardTitle>
            <Badge variant="outline" className="border-emerald-800 text-emerald-400 bg-emerald-950/40 text-[10px]">
              ENABLED
            </Badge>
          </CardHeader>
          <CardContent className="p-4 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Algorithm</span>
              <span className="font-mono text-purple-300 font-bold">ARGON2ID</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800 text-[11px]">
              <span className="text-slate-400">Memory Cost</span>
              <span className="font-mono text-slate-200">64 MB (65,536 KiB)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800 text-[11px]">
              <span className="text-slate-400">Time Cost</span>
              <span className="font-mono text-slate-200">3 iterations</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800 text-[11px]">
              <span className="text-slate-400">Parallelism</span>
              <span className="font-mono text-slate-200">1 thread</span>
            </div>
            <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>PASSWORD HASH STATUS:</span>
              <span className="text-emerald-400 font-bold">PRESENT / RESTRICTED</span>
            </div>
          </CardContent>
        </Card>

        {/* PANEL 3: MESSAGE SECURITY */}
        <Card className="border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader className="py-3 border-b border-slate-800 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-mono uppercase text-slate-300 flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-emerald-400" /> MESSAGE SECURITY
            </CardTitle>
            <Badge
              variant="outline"
              className={`text-[10px] ${
                settings?.messageSecurityEnabled
                  ? "border-emerald-800 text-emerald-400 bg-emerald-950/40"
                  : "border-amber-800 text-amber-400 bg-amber-950/40"
              }`}
            >
              {settings?.messageSecurityEnabled ? "PROTECTED" : "CLASSROOM DEMO MODE"}
            </Badge>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400">Protection</span>
              <button
                onClick={() => handleToggleSetting("messageSecurityEnabled", !settings?.messageSecurityEnabled)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                  settings?.messageSecurityEnabled
                    ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                    : "bg-amber-950 text-amber-400 border border-amber-800"
                }`}
              >
                {settings?.messageSecurityEnabled ? "ENABLED" : "DEMO MODE"}
              </button>
            </div>
            <div className="space-y-1 pt-1">
              <label className="text-[10px] font-mono text-slate-400 block">Classroom Demo Representation:</label>
              <select
                value={settings?.messageRepresentation || "PROTECTED"}
                onChange={(e) => handleToggleSetting("messageRepresentation", e.target.value)}
                className="w-full rounded bg-slate-950 border border-slate-700 px-2 py-1 text-xs font-mono text-indigo-300 focus:outline-none"
              >
                <option value="PROTECTED">PROTECTED REPRESENTATION</option>
                <option value="SIMULATED_EXPOSED">SIMULATED EXPOSED REPRESENTATION</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* PANEL 4: ENVIRONMENT / HOSTING */}
        <Card className="border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader className="py-3 border-b border-slate-800 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-mono uppercase text-slate-300 flex items-center gap-1.5">
              <Server className="h-4 w-4 text-cyan-400" /> ENVIRONMENT
            </CardTitle>
            <Badge variant="outline" className="border-slate-700 text-slate-400 text-[9px] uppercase font-mono">
              STATUS / INFORMATION
            </Badge>
          </CardHeader>
          <CardContent className="p-4 space-y-2 text-[11px] font-mono">
            <div className="flex justify-between py-0.5 border-b border-slate-800">
              <span className="text-slate-400">APPLICATION</span>
              <span className="text-slate-200 font-bold">{environment.application || "Instagramer"}</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-800">
              <span className="text-slate-400">ENVIRONMENT</span>
              <span className="text-amber-400 font-bold">Classroom Demo</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-800">
              <span className="text-slate-400">DATABASE</span>
              <span className="text-emerald-400">Neon PostgreSQL</span>
            </div>
            <div className="flex justify-between py-0.5 border-b border-slate-800">
              <span className="text-slate-400">AUTHENTICATION</span>
              <span className="text-emerald-400">Argon2id Active</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-400">HOSTING</span>
              <span className="text-emerald-400">Vercel Connected</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CLASSROOM ACCOUNT INSPECTOR */}
      <Card className="border-slate-800 bg-slate-900 text-slate-100 shadow-md">
        <CardHeader className="border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-indigo-400" /> CLASSROOM ACCOUNT INSPECTOR
            </CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspect user status, authentication format, lockout state, and Argon2id hash presence (Plaintext never stored)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 font-mono">Select Account:</label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-slate-200 px-3 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  @{acc.username} ({acc.role})
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {selectedAccount ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 font-mono text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 block uppercase">Username</span>
                <span className="text-slate-100 font-bold block truncate">@{selectedAccount.username}</span>
                <Badge variant="outline" className="text-[9px] border-slate-700">
                  {selectedAccount.role}
                </Badge>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 block uppercase">Account Status</span>
                <span className={`font-bold block ${selectedAccount.status === "ACTIVE" ? "text-emerald-400" : "text-red-400"}`}>
                  {selectedAccount.status}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 block uppercase">Authentication</span>
                <span className="text-slate-200 font-bold block">USERNAME + PASSWORD</span>
                <span className="text-[9px] text-slate-400">FORMAT: {selectedAccount.passwordFormat}</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 block uppercase">Password Hash</span>
                <span className="text-emerald-400 font-bold block">PRESENT</span>
                <span className="text-[9px] text-slate-400 block">ALGORITHM: {selectedAccount.hashAlgorithm}</span>
                <span className="text-[9px] text-amber-400 font-bold block">ACCESS: RESTRICTED</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 block uppercase">Plaintext Password</span>
                <span className="text-red-400 font-bold block">NEVER STORED</span>
                <span className="text-[9px] text-slate-500">Zero Export API</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 block uppercase">Lockout Status</span>
                <span className={`font-bold block ${selectedAccount.isLocked ? "text-red-400" : "text-emerald-400"}`}>
                  {selectedAccount.isLocked ? `LOCKED (~${selectedAccount.remainingMinutes}m)` : "INACTIVE"}
                </span>
                {selectedAccount.isLocked && (
                  <button
                    onClick={() => handleUnlockUser(selectedAccount.id, selectedAccount.username)}
                    disabled={unlockLoadingId === selectedAccount.id}
                    className="text-[10px] text-amber-400 hover:underline"
                  >
                    Unlock User
                  </button>
                )}
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 block uppercase">Rate Limit</span>
                <span className="text-emerald-400 font-bold block">{selectedAccount.rateLimitStatus}</span>
              </div>
            </div>
          ) : (
            <div className="text-slate-500 text-center py-4">No account selected</div>
          )}
        </CardContent>
      </Card>

      {/* SECURITY EVENT LOG */}
      <Card className="border-slate-800 bg-slate-900 text-slate-100 shadow-md">
        <CardHeader className="border-b border-slate-800 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Terminal className="h-4 w-4 text-blue-400" /> SECURITY EVENT LOG
          </CardTitle>
          <Badge variant="outline" className="border-blue-800 bg-blue-950/40 text-blue-400 text-xs font-mono">
            Zero Password Logging Verified
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-800/60 font-mono text-xs max-h-96 overflow-y-auto">
            {events.length === 0 ? (
              <div className="p-6 text-center text-slate-500">No security events recorded yet.</div>
            ) : (
              events.map((evt) => (
                <div key={evt.id} className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-400 text-[11px]">{getEventTag(evt.eventType)}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        evt.eventType.includes("FAILURE") || evt.eventType.includes("LOCKED") || evt.eventType.includes("TRIGGERED")
                          ? "border-red-800 bg-red-950/60 text-red-400"
                          : evt.eventType.includes("DISABLED")
                          ? "border-amber-800 bg-amber-950/60 text-amber-400"
                          : "border-emerald-800 bg-emerald-950/60 text-emerald-400"
                      }`}
                    >
                      {formatEventName(evt.eventType)}
                    </Badge>
                    {evt.username && (
                      <span className="text-slate-300 font-semibold text-[11px]">@{evt.username}</span>
                    )}
                    {evt.metadata && (
                      <span className="text-slate-500 text-[10px] truncate max-w-sm">{evt.metadata}</span>
                    )}
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
