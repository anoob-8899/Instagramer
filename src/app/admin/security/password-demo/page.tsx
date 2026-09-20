"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Unlock,
  Key,
  Database,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Cpu,
  Layers,
  Flame,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface HashDemoResponse {
  success: boolean;
  syntheticInput: string;
  hashResult: string;
  telemetry: {
    algorithm: string;
    version: number;
    memoryCost: string;
    timeCostIterations: number;
    parallelismThreads: number;
    saltExtracted: string;
    digestExtracted: string;
    computationTimeMs: number;
    securityProperty: string;
  };
}

export default function PasswordLockoutDemoPage() {
  // Section 1: Synthetic Argon2id Hash State
  const [samplePassword, setSamplePassword] = useState("ExamplePassword123!");
  const [isHashing, setIsHashing] = useState(false);
  const [hashData, setHashData] = useState<HashDemoResponse | null>(null);
  const [hashError, setHashError] = useState<string | null>(null);

  // Section 2: In-Memory Synthetic Lockout State Simulator
  const [simAttempts, setSimAttempts] = useState<number>(0);
  const [simLockedUntil, setSimLockedUntil] = useState<Date | null>(null);
  const [simLog, setSimLog] = useState<Array<{ text: string; type: "fail" | "lock" | "success" | "unlock" }>>([]);

  const runHashDemo = async () => {
    try {
      setIsHashing(true);
      setHashError(null);

      const res = await fetch("/api/admin/security/hash-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ samplePassword }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to run Argon2id demonstration");
      setHashData(json);
    } catch (err: any) {
      setHashError(err.message || "Failed to run Argon2id demonstration");
    } finally {
      setIsHashing(false);
    }
  };

  // Lockout Simulator Handlers (Strictly in browser memory)
  const handleSimulateFailedAttempt = () => {
    const now = new Date();
    if (simLockedUntil && simLockedUntil > now) {
      setSimLog((prev) => [
        { text: `[BLOCKED] Login rejected: Account is locked until ${simLockedUntil.toLocaleTimeString()}`, type: "lock" },
        ...prev,
      ]);
      return;
    }

    const nextCount = (simLockedUntil && simLockedUntil <= now ? 0 : simAttempts) + 1;
    if (nextCount >= 5) {
      const lockExpiry = new Date(now.getTime() + 15 * 60 * 1000);
      setSimAttempts(5);
      setSimLockedUntil(lockExpiry);
      setSimLog((prev) => [
        { text: `[LOCKOUT] Attempt #5 failed. Account temporarily LOCKED for 15 minutes (until ${lockExpiry.toLocaleTimeString()}). HTTP 429 returned.`, type: "lock" },
        ...prev,
      ]);
    } else {
      setSimAttempts(nextCount);
      setSimLog((prev) => [
        { text: `[FAILED] Attempt #${nextCount} failed. Generic 401 response issued. (${5 - nextCount} attempts remaining before lockout)`, type: "fail" },
        ...prev,
      ]);
    }
  };

  const handleSimulateSuccessfulLogin = () => {
    const now = new Date();
    if (simLockedUntil && simLockedUntil > now) {
      setSimLog((prev) => [
        { text: `[REJECTED] Login blocked by active lockout. Successful login impossible while locked.`, type: "lock" },
        ...prev,
      ]);
      return;
    }

    setSimAttempts(0);
    setSimLockedUntil(null);
    setSimLog((prev) => [
      { text: `[SUCCESS] Authentication succeeded. Failed attempt counter cleared to 0. Session token issued.`, type: "success" },
      ...prev,
    ]);
  };

  const handleSimulateAdminUnlock = () => {
    setSimAttempts(0);
    setSimLockedUntil(null);
    setSimLog((prev) => [
      { text: `[ADMIN UNLOCK] Administrator reset lockout and cleared failed attempts counter. Account restored to ACTIVE.`, type: "unlock" },
      ...prev,
    ]);
  };

  const handleResetSimulator = () => {
    setSimAttempts(0);
    setSimLockedUntil(null);
    setSimLog([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/security"
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Security Center
            </Link>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2 mt-1">
            <ShieldCheck className="h-5 w-5 text-indigo-400" />
            Argon2id Hashing & Account Lockout Laboratory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Interactive educational demonstration of memory-hard Argon2id key derivation and brute-force lockout mechanics.
          </p>
        </div>
      </div>

      {/* Full Security Laboratory Link Banner */}
      <div className="rounded-xl border border-emerald-800 bg-emerald-950/40 p-4 text-xs text-emerald-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
          <div>
            <span className="font-semibold text-emerald-100">Full Security Demonstration Laboratory Available:</span>
            <p className="text-emerald-300/90 text-[11px] mt-0.5">
              Access the complete classroom laboratory covering Password Hashing, Hash Verification, Account Lockout, Session Security, Audit Sanitization, and E2EE Privacy Boundaries.
            </p>
          </div>
        </div>
        <Link
          href="/admin/security/lab"
          className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs px-3.5 py-2 shrink-0 transition-colors"
        >
          Open Security Lab →
        </Link>
      </div>

      {/* Safety Notice Card */}
      <div className="rounded-xl border border-indigo-900/60 bg-indigo-950/30 p-4 text-xs text-indigo-200 flex items-start gap-3">
        <Cpu className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-indigo-100">Strict Safety & Isolation Guarantee:</span>
          <p className="mt-0.5 text-indigo-300/90 text-[11px] leading-relaxed">
            This classroom laboratory executes in-memory computations on synthetic sample data only. It does not access, reveal, or store real user credentials, and does not alter production authentication state.
          </p>
        </div>
      </div>

      {/* Part 1: Argon2id Hashing Deep Dive */}
      <Card className="border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader className="pb-3 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Key className="h-4 w-4 text-indigo-400" />
              1. Argon2id Password Hashing Transformation
            </CardTitle>
            <Badge variant="outline" className="text-[10px] border-indigo-800 text-indigo-300 bg-indigo-950/40">
              RFC 9106 / OWASP Standard
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400">Enter Synthetic Sample Password:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={samplePassword}
                onChange={(e) => setSamplePassword(e.target.value)}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none font-mono"
                placeholder="Type synthetic password..."
              />
              <Button
                onClick={runHashDemo}
                disabled={!samplePassword.trim() || isHashing}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2 flex items-center gap-2 shrink-0"
              >
                {isHashing ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Flame className="h-3.5 w-3.5 text-amber-300" />
                )}
                Compute Argon2id Hash
              </Button>
            </div>
          </div>

          {hashError && (
            <div className="rounded-lg border border-red-800 bg-red-950/50 p-3 text-xs text-red-300">
              {hashError}
            </div>
          )}

          {hashData && (
            <div className="space-y-4 pt-2 animate-in fade-in duration-300">
              {/* Transformation Visualizer */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-400 block mb-1">SYNTHETIC INPUT</span>
                  <p className="text-xs font-mono text-emerald-400 truncate">"{hashData.syntheticInput}"</p>
                  <span className="text-[9px] text-slate-500 mt-1 block">Plaintext string in memory</span>
                </div>
                <div className="flex items-center justify-center text-slate-500">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] text-indigo-400 mb-1">Argon2id (m=64MB, t=3, p=1)</span>
                    <ArrowRight className="h-5 w-5 text-indigo-400" />
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-400 block mb-1">DATABASE STORAGE</span>
                  <p className="text-xs font-mono text-amber-400 truncate">$argon2id$...$digest</p>
                  <span className="text-[9px] text-emerald-400 mt-1 block">One-way non-reversible hash</span>
                </div>
              </div>

              {/* Exact Computed Hash Output */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Database className="h-3.5 w-3.5 text-amber-400" />
                    Computed Hash Result (stored in User.passwordHash):
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Elapsed: <strong className="text-indigo-300">{hashData.telemetry.computationTimeMs} ms</strong>
                  </span>
                </div>
                <pre className="rounded-xl bg-slate-950 p-3 text-[11px] font-mono text-amber-300 overflow-x-auto border border-slate-800">
                  {hashData.hashResult}
                </pre>
              </div>

              {/* Cryptographic Parameters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Memory Cost (m)</span>
                  <span className="font-mono text-slate-200 font-bold">{hashData.telemetry.memoryCost}</span>
                </div>
                <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Time Cost (t)</span>
                  <span className="font-mono text-slate-200 font-bold">{hashData.telemetry.timeCostIterations} iterations</span>
                </div>
                <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Parallelism (p)</span>
                  <span className="font-mono text-slate-200 font-bold">{hashData.telemetry.parallelismThreads} thread</span>
                </div>
                <div className="rounded-lg bg-slate-950 p-2.5 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Argon2 Version (v)</span>
                  <span className="font-mono text-slate-200 font-bold">v={hashData.telemetry.version} (0x13)</span>
                </div>
              </div>

              {/* Defense Rationale */}
              <div className="rounded-xl bg-slate-950/80 p-3 text-xs text-slate-300 border border-slate-800 space-y-1">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  Why Argon2id is Superior to Legacy Hashes:
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Unlike MD5, SHA-1, or plain SHA-256 (which are fast and easily cracked by GPUs executing billions of guesses per second), Argon2id requires 64 MB of dedicated RAM per hash evaluation. This memory-hardness renders GPU and ASIC farm attacks cost-prohibitive.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Part 2: Brute-Force Account Lockout Simulator */}
      <Card className="border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader className="pb-3 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-400" />
                2. Account Lockout Lifecycle Simulator
              </CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulate failed authentication attempts, threshold lockout enforcement (5 attempts), and administrative unlock
              </p>
            </div>
            <Badge
              variant="outline"
              className={`text-xs ${
                simLockedUntil && simLockedUntil > new Date()
                  ? "border-red-800 bg-red-950/60 text-red-400"
                  : simAttempts > 0
                  ? "border-amber-800 bg-amber-950/60 text-amber-400"
                  : "border-emerald-800 bg-emerald-950/60 text-emerald-400"
              }`}
            >
              {simLockedUntil && simLockedUntil > new Date()
                ? "ACCOUNT LOCKED"
                : `${simAttempts}/5 Failed Attempts`}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {/* Visual Attempt Trackers */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Failure Progress to Lockout (Threshold: 5)</span>
              <span className="font-mono">
                {simAttempts >= 5 ? "100% (LOCKED)" : `${simAttempts * 20}%`}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((slot) => {
                const isFilled = simAttempts >= slot;
                const isFinal = slot === 5;
                return (
                  <div
                    key={slot}
                    className={`h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold transition-all ${
                      isFilled
                        ? isFinal
                          ? "bg-red-600 text-white shadow-lg shadow-red-900/50"
                          : "bg-amber-600 text-white"
                        : "bg-slate-950 border border-slate-800 text-slate-500"
                    }`}
                  >
                    Attempt {slot}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Simulation Controls */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button
              size="sm"
              onClick={handleSimulateFailedAttempt}
              className="bg-red-950 border border-red-800 text-red-300 hover:bg-red-900 text-xs flex items-center gap-1.5"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
              Simulate Wrong Password (+1 Failure)
            </Button>

            <Button
              size="sm"
              onClick={handleSimulateSuccessfulLogin}
              className="bg-emerald-950 border border-emerald-800 text-emerald-300 hover:bg-emerald-900 text-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              Simulate Correct Password (Reset)
            </Button>

            <Button
              size="sm"
              onClick={handleSimulateAdminUnlock}
              disabled={simAttempts === 0 && !simLockedUntil}
              className="bg-blue-950 border border-blue-800 text-blue-300 hover:bg-blue-900 text-xs flex items-center gap-1.5"
            >
              <Unlock className="h-3.5 w-3.5 text-blue-400" />
              Simulate Admin Unlock
            </Button>

            <Button
              size="sm"
              variant="secondary"
              onClick={handleResetSimulator}
              className="text-xs bg-slate-800 text-slate-300 hover:bg-slate-700 ml-auto"
            >
              Reset Simulation
            </Button>
          </div>

          {/* Event Log Output */}
          <div className="space-y-1.5 pt-2">
            <span className="text-xs font-semibold text-slate-400">Simulation Event Trail:</span>
            <div className="rounded-xl bg-slate-950 p-3 max-h-48 overflow-y-auto border border-slate-800 space-y-1.5 font-mono text-xs">
              {simLog.length === 0 ? (
                <div className="text-slate-500 text-[11px] text-center py-2">
                  No simulation events yet. Click buttons above to trigger failure/success lifecycle events.
                </div>
              ) : (
                simLog.map((entry, idx) => (
                  <div
                    key={idx}
                    className={`text-[11px] py-1 border-b border-slate-900/80 last:border-0 ${
                      entry.type === "lock"
                        ? "text-red-400 font-semibold"
                        : entry.type === "fail"
                        ? "text-amber-400"
                        : entry.type === "success"
                        ? "text-emerald-400 font-semibold"
                        : "text-blue-400 font-semibold"
                    }`}
                  >
                    {entry.text}
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
