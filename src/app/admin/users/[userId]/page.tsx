"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  ArrowLeft,
  Shield,
  UserX,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Mail,
  FileText,
  Heart,
  MessageSquare,
  Lock,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface UserDetails {
  id: string;
  username: string;
  email: string;
  role: "USER" | "MODERATOR" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
  updatedAt: string;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  isLocked: boolean;
  profile: {
    id: string;
    displayName: string | null;
    bio: string | null;
    avatarUrl: string | null;
  } | null;
  stats: {
    postsCount: number;
    followersCount: number;
    followingCount: number;
    likesCount: number;
    commentsCount: number;
    reportsCount: number;
  };
}

export default function AdminUserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const resolvedParams = use(params);
  const userId = resolvedParams.userId;
  const router = useRouter();

  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Selected new role
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/admin/users/${userId}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to load user");
      }
      const data = await res.json();
      setUser(data.user);
      setSelectedRole(data.user.role);
    } catch (err: any) {
      setError(err.message || "Failed to load user details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetails();
  }, [userId]);

  const handleRoleChange = async () => {
    if (!user || !selectedRole) return;
    try {
      setActionLoading(true);
      setError(null);
      setSuccessMsg(null);

      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update role");

      setSuccessMsg("User role updated successfully");
      setRoleModalOpen(false);
      fetchUserDetails();
    } catch (err: any) {
      setError(err.message || "Failed to update role");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!user) return;
    try {
      setActionLoading(true);
      setError(null);
      setSuccessMsg(null);

      const newStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");

      setSuccessMsg(`Account ${newStatus === "SUSPENDED" ? "suspended" : "unsuspended"} successfully`);
      setSuspendModalOpen(false);
      fetchUserDetails();
    } catch (err: any) {
      setError(err.message || "Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        Loading user administrative details...
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="space-y-4">
        <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200">
          <ArrowLeft className="h-4 w-4" /> Back to Users Directory
        </Link>
        <div className="rounded-lg border border-red-800 bg-red-950/60 p-4 text-xs text-red-300">
          {error}
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Top navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Users Directory
        </Link>
        <Button
          size="sm"
          variant="secondary"
          onClick={fetchUserDetails}
          className="h-7 text-xs bg-slate-800 text-slate-300 hover:bg-slate-700"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh Details
        </Button>
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

      {/* Profile Header Card */}
      <Card className="border-slate-800 bg-slate-900 text-slate-100">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center font-bold text-xl text-slate-300 shrink-0 overflow-hidden">
                {user.profile?.avatarUrl ? (
                  <img src={user.profile.avatarUrl} alt={user.username} className="h-full w-full object-cover" />
                ) : (
                  user.username.charAt(0).toUpperCase()
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-slate-100">@{user.username}</h1>
                  <Badge
                    variant="outline"
                    className={`text-[10px] uppercase font-mono ${
                      user.role === "ADMIN"
                        ? "border-red-800 bg-red-950/60 text-red-400"
                        : user.role === "MODERATOR"
                        ? "border-amber-800 bg-amber-950/60 text-amber-400"
                        : "border-slate-700 bg-slate-800 text-slate-300"
                    }`}
                  >
                    {user.role}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-[10px] uppercase font-mono ${
                      user.status === "ACTIVE"
                        ? "border-emerald-800 bg-emerald-950/60 text-emerald-400"
                        : "border-red-800 bg-red-950/60 text-red-400"
                    }`}
                  >
                    {user.status}
                  </Badge>
                  {user.isLocked && (
                    <Badge variant="outline" className="text-[10px] border-amber-800 bg-amber-950/60 text-amber-400">
                      Locked
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-300 font-medium">{user.profile?.displayName || "No display name"}</p>
                {user.profile?.bio && <p className="text-xs text-slate-400 max-w-md">{user.profile.bio}</p>}
                <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1 font-mono">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" /> {user.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> Joined {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setRoleModalOpen(true)}
                className="text-xs bg-slate-800 text-slate-200 hover:bg-slate-700"
              >
                <Shield className="h-3.5 w-3.5 mr-1" /> Change Role
              </Button>
              {user.status === "ACTIVE" ? (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setSuspendModalOpen(true)}
                  className="text-xs bg-red-950 text-red-400 border border-red-800 hover:bg-red-900"
                >
                  <UserX className="h-3.5 w-3.5 mr-1" /> Suspend Account
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setSuspendModalOpen(true)}
                  className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 hover:bg-emerald-900"
                >
                  <UserCheck className="h-3.5 w-3.5 mr-1" /> Restore Account
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats and Security telemetry grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Activity Summary */}
        <Card className="border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-400" /> Platform Activity Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Total Posts Created</span>
              <span className="font-semibold text-slate-200">{user.stats.postsCount}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Followers</span>
              <span className="font-semibold text-slate-200">{user.stats.followersCount}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Following</span>
              <span className="font-semibold text-slate-200">{user.stats.followingCount}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Likes Given</span>
              <span className="font-semibold text-slate-200">{user.stats.likesCount}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400">Comments Written</span>
              <span className="font-semibold text-slate-200">{user.stats.commentsCount}</span>
            </div>
          </CardContent>
        </Card>

        {/* Security & Lockout Telemetry */}
        <Card className="border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-400" /> Security Telemetry & Lockout
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">User UUID</span>
              <span className="font-mono text-[11px] text-slate-300">{user.id}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Failed Login Counter</span>
              <span className="font-semibold text-slate-200">{user.failedLoginAttempts} / 5</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Lockout Expiration</span>
              <span className="font-mono text-slate-200">
                {user.lockedUntil ? new Date(user.lockedUntil).toLocaleString() : "None (Account Unlocked)"}
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-400">Reports Submitted Against User</span>
              <span className="font-semibold text-slate-200">{user.stats.reportsCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Change Modal */}
      {roleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-950/80 border border-blue-800 text-blue-400">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Modify Role for @{user.username}</h3>
                <p className="text-xs text-slate-400">Select target role permissions.</p>
              </div>
            </div>

            <div className="space-y-2 py-2">
              {(["USER", "MODERATOR", "ADMIN"] as const).map((r) => (
                <label
                  key={r}
                  className={`flex items-center justify-between p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                    selectedRole === r
                      ? "border-blue-500 bg-blue-950/40 text-blue-200"
                      : "border-slate-800 bg-slate-950 hover:bg-slate-800/50 text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="role"
                      value={r}
                      checked={selectedRole === r}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="text-blue-600 focus:ring-0"
                    />
                    <span className="font-mono font-bold">{r}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {r === "ADMIN" ? "Full Control" : r === "MODERATOR" ? "Content Review" : "Standard User"}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRoleModalOpen(false)}
                disabled={actionLoading}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleRoleChange}
                disabled={actionLoading || selectedRole === user.role}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
              >
                {actionLoading ? "Updating..." : "Save Role"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Confirmation Modal */}
      {suspendModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-950/80 border border-red-800 text-red-400">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  {user.status === "ACTIVE" ? `Suspend @${user.username}?` : `Unsuspend @${user.username}?`}
                </h3>
                <p className="text-xs text-slate-400">Administrative account status action.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800">
              {user.status === "ACTIVE"
                ? `Suspending @${user.username} will immediately prevent the user from logging in or making social mutations.`
                : `Unsuspending @${user.username} will reactivate standard platform privileges for this account.`}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSuspendModalOpen(false)}
                disabled={actionLoading}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleStatusToggle}
                disabled={actionLoading}
                className={`text-xs ${
                  user.status === "ACTIVE"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                {actionLoading ? "Processing..." : user.status === "ACTIVE" ? "Confirm Suspension" : "Confirm Restore"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
