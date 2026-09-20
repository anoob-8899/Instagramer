"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  Filter,
  Shield,
  ShieldAlert,
  UserX,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface UserItem {
  id: string;
  username: string;
  email: string;
  role: "USER" | "MODERATOR" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
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
    reportsCount: number;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Action Confirmation Modals State
  const [actionModal, setActionModal] = useState<{
    type: "ROLE" | "SUSPEND" | "UNSUSPEND";
    user: UserItem;
    targetRole?: "USER" | "MODERATOR" | "ADMIN";
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
      });

      if (search) params.set("search", search);
      if (roleFilter !== "ALL") params.set("role", roleFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch users");
      }

      const data = await res.json();
      setUsers(data.users);
      setTotalPages(data.pagination.totalPages || 1);
      setTotalCount(data.pagination.total || 0);
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleExecuteAction = async () => {
    if (!actionModal) return;
    try {
      setActionLoading(true);
      setError(null);
      setSuccessMsg(null);

      const body: any = {};
      if (actionModal.type === "ROLE" && actionModal.targetRole) {
        body.role = actionModal.targetRole;
      } else if (actionModal.type === "SUSPEND") {
        body.status = "SUSPENDED";
      } else if (actionModal.type === "UNSUSPEND") {
        body.status = "ACTIVE";
      }

      const res = await fetch(`/api/admin/users/${actionModal.user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Action failed");
      }

      setSuccessMsg(data.message || "User updated successfully");
      setActionModal(null);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || "Failed to update user");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-500" />
            User Management Console
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Directory of registered users, role permissions, suspension controls, and profile inspection
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-slate-700 text-slate-300">
            Total Users: {totalCount}
          </Badge>
          <Button
            size="sm"
            variant="secondary"
            onClick={fetchUsers}
            disabled={loading}
            className="text-xs bg-slate-800 text-slate-200 hover:bg-slate-700"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
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

      {/* Filter and Search Bar */}
      <Card className="border-slate-800 bg-slate-900 text-slate-100">
        <CardContent className="p-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search by username, display name, or email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 bg-slate-950 border-slate-800 text-xs text-slate-100 placeholder:text-slate-500"
              />
            </div>
            <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs px-4">
              Search
            </Button>
            {search && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setSearchInput("");
                  setPage(1);
                }}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Clear Search
              </Button>
            )}
          </form>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
            {/* Role Filters */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="font-mono text-[11px] mr-1">Role:</span>
              {["ALL", "USER", "MODERATOR", "ADMIN"].map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRoleFilter(r);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    roleFilter === r
                      ? "bg-blue-600 text-white font-medium"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Status Filters */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="font-mono text-[11px] mr-1">Status:</span>
              {["ALL", "ACTIVE", "SUSPENDED"].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setStatusFilter(s);
                    setPage(1);
                  }}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    statusFilter === s
                      ? s === "SUSPENDED"
                        ? "bg-red-600 text-white font-medium"
                        : "bg-emerald-600 text-white font-medium"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-slate-800 bg-slate-900 text-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-mono text-[10px]">
                <th className="p-3.5">User</th>
                <th className="p-3.5">Email (Admin View)</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Activity Stats</th>
                <th className="p-3.5">Joined Date</th>
                <th className="p-3.5 text-right">Administrative Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Loading users directory...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No users matching criteria found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* User Identity */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 text-xs shrink-0 overflow-hidden">
                          {u.profile?.avatarUrl ? (
                            <img src={u.profile.avatarUrl} alt={u.username} className="h-full w-full object-cover" />
                          ) : (
                            u.username.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-100">@{u.username}</div>
                          <div className="text-[11px] text-slate-400">
                            {u.profile?.displayName || "—"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="p-3.5 font-mono text-slate-300">{u.email}</td>

                    {/* Role */}
                    <td className="p-3.5">
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase font-mono ${
                          u.role === "ADMIN"
                            ? "border-red-800 bg-red-950/60 text-red-400"
                            : u.role === "MODERATOR"
                            ? "border-amber-800 bg-amber-950/60 text-amber-400"
                            : "border-slate-700 bg-slate-800/60 text-slate-300"
                        }`}
                      >
                        {u.role}
                      </Badge>
                    </td>

                    {/* Status */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase font-mono ${
                            u.status === "ACTIVE"
                              ? "border-emerald-800 bg-emerald-950/60 text-emerald-400"
                              : "border-red-800 bg-red-950/60 text-red-400"
                          }`}
                        >
                          {u.status}
                        </Badge>
                        {u.isLocked && (
                          <Badge variant="outline" className="text-[10px] border-amber-800 bg-amber-950/60 text-amber-400">
                            Locked
                          </Badge>
                        )}
                      </div>
                    </td>

                    {/* Stats */}
                    <td className="p-3.5 text-slate-400 text-[11px]">
                      <div>{u.stats.postsCount} posts • {u.stats.followersCount} followers</div>
                    </td>

                    {/* Joined Date */}
                    <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/admin/users/${u.id}`}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs text-slate-300 hover:bg-slate-800"
                            title="View Full Profile"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </Link>

                        {/* Role Change Selector */}
                        <select
                          value={u.role}
                          onChange={(e) => {
                            const newRole = e.target.value as "USER" | "MODERATOR" | "ADMIN";
                            if (newRole !== u.role) {
                              setActionModal({ type: "ROLE", user: u, targetRole: newRole });
                            }
                          }}
                          className="h-7 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300 px-1.5 focus:outline-none focus:border-blue-500"
                        >
                          <option value="USER">USER</option>
                          <option value="MODERATOR">MODERATOR</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>

                        {/* Suspend / Unsuspend */}
                        {u.status === "ACTIVE" ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setActionModal({ type: "SUSPEND", user: u })}
                            className="h-7 px-2 text-xs text-red-400 hover:bg-red-950/50 hover:text-red-300"
                            title="Suspend User"
                          >
                            <UserX className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setActionModal({ type: "UNSUSPEND", user: u })}
                            className="h-7 px-2 text-xs text-emerald-400 hover:bg-emerald-950/50 hover:text-emerald-300"
                            title="Unsuspend User"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing Page <span className="font-semibold text-slate-200">{page}</span> of{" "}
            <span className="font-semibold text-slate-200">{totalPages}</span> ({totalCount} total)
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-7 px-2 bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-7 px-2 bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Confirmation Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-950/80 border border-red-800 text-red-400">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  {actionModal.type === "ROLE"
                    ? `Change Role for @${actionModal.user.username}?`
                    : actionModal.type === "SUSPEND"
                    ? `Suspend Account @${actionModal.user.username}?`
                    : `Unsuspend Account @${actionModal.user.username}?`}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Administrative confirmation required.</p>
              </div>
            </div>

            <div className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800 space-y-1.5">
              {actionModal.type === "ROLE" ? (
                <>
                  <p>
                    Target User: <strong>@{actionModal.user.username}</strong> ({actionModal.user.email})
                  </p>
                  <p>
                    Current Role: <span className="font-mono text-slate-400">{actionModal.user.role}</span> → New
                    Role: <span className="font-mono font-bold text-amber-400">{actionModal.targetRole}</span>
                  </p>
                  {actionModal.targetRole === "ADMIN" && (
                    <p className="text-red-400 font-semibold mt-1">
                      ⚠️ WARNING: Granting ADMIN privileges gives this user full platform control.
                    </p>
                  )}
                </>
              ) : actionModal.type === "SUSPEND" ? (
                <p>
                  Suspending <strong>@{actionModal.user.username}</strong> will immediately block their ability to log
                  in, publish posts, send comments, or interact with feeds.
                </p>
              ) : (
                <p>
                  Unsuspending <strong>@{actionModal.user.username}</strong> will restore full platform access for this
                  account.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActionModal(null)}
                disabled={actionLoading}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleExecuteAction}
                disabled={actionLoading}
                className={`text-xs ${
                  actionModal.type === "SUSPEND"
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : actionModal.targetRole === "ADMIN"
                    ? "bg-amber-600 hover:bg-amber-700 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                {actionLoading ? "Updating..." : "Confirm & Apply"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
