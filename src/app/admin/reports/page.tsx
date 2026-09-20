"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Filter,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Trash2,
  UserX,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface ReportItem {
  id: string;
  targetType: "POST" | "COMMENT" | "USER";
  targetId: string;
  reason: string;
  status: "PENDING" | "REVIEWED" | "DISMISSED" | "ACTION_TAKEN";
  notes: string | null;
  createdAt: string;
  reviewedAt: string | null;
  reporter: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  reviewedBy: {
    id: string;
    username: string;
  } | null;
  targetDetails: any;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [targetTypeFilter, setTargetTypeFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Action Modal State
  const [actionModal, setActionModal] = useState<{
    report: ReportItem;
    targetStatus: "REVIEWED" | "DISMISSED" | "ACTION_TAKEN";
    actionType?: "DELETE_TARGET" | "SUSPEND_USER";
  } | null>(null);
  const [notes, setNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
      });

      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (targetTypeFilter !== "ALL") params.set("targetType", targetTypeFilter);

      const res = await fetch(`/api/admin/reports?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch reports");
      }

      const data = await res.json();
      setReports(data.reports);
      setTotalPages(data.pagination.totalPages || 1);
      setTotalCount(data.pagination.total || 0);
    } catch (err: any) {
      setError(err.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, targetTypeFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleExecuteReportAction = async () => {
    if (!actionModal) return;
    try {
      setActionLoading(true);
      setError(null);
      setSuccessMsg(null);

      const res = await fetch(`/api/admin/reports/${actionModal.report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: actionModal.targetStatus,
          actionType: actionModal.actionType,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update report");

      setSuccessMsg(data.message || "Report updated successfully");
      setActionModal(null);
      setNotes("");
      fetchReports();
    } catch (err: any) {
      setError(err.message || "Failed to execute report action");
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
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            User Reports & Moderation Queue
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review user-submitted incident reports against posts, comments, and accounts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-slate-700 text-slate-300">
            Total In Queue: {totalCount}
          </Badge>
          <Button
            size="sm"
            variant="secondary"
            onClick={fetchReports}
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

      {/* Filters Bar */}
      <Card className="border-slate-800 bg-slate-900 text-slate-100">
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="font-mono text-[11px] mr-1">Status:</span>
            {["PENDING", "REVIEWED", "ACTION_TAKEN", "DISMISSED", "ALL"].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatusFilter(s);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  statusFilter === s
                    ? s === "PENDING"
                      ? "bg-amber-600 text-white font-medium"
                      : s === "ACTION_TAKEN"
                      ? "bg-red-600 text-white font-medium"
                      : "bg-blue-600 text-white font-medium"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {s.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* Target Type Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="font-mono text-[11px] mr-1">Target Type:</span>
            {["ALL", "POST", "COMMENT", "USER"].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTargetTypeFilter(t);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded text-xs transition-colors ${
                  targetTypeFilter === t
                    ? "bg-slate-700 text-white font-medium"
                    : "bg-slate-800/60 text-slate-400 hover:text-slate-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card className="border-slate-800 bg-slate-900 text-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-mono text-[10px]">
                <th className="p-3.5">Target</th>
                <th className="p-3.5">Reported By</th>
                <th className="p-3.5">Reason & Description</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Report Date</th>
                <th className="p-3.5">Reviewed By</th>
                <th className="p-3.5 text-right">Moderator Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Loading reports queue...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No reports matching current filter criteria.
                  </td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Target Type & Preview */}
                    <td className="p-3.5">
                      <div className="space-y-1">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-mono ${
                            r.targetType === "POST"
                              ? "border-blue-800 bg-blue-950/60 text-blue-400"
                              : r.targetType === "COMMENT"
                              ? "border-purple-800 bg-purple-950/60 text-purple-400"
                              : "border-amber-800 bg-amber-950/60 text-amber-400"
                          }`}
                        >
                          {r.targetType}
                        </Badge>
                        <div className="text-[11px] text-slate-300 max-w-xs truncate">
                          {r.targetDetails?.deleted ? (
                            <span className="text-red-400 italic">[Target Deleted / Removed]</span>
                          ) : r.targetType === "POST" ? (
                            <span>Post by @{r.targetDetails?.author?.username}: "{r.targetDetails?.caption || 'Media'}"</span>
                          ) : r.targetType === "COMMENT" ? (
                            <span>Comment by @{r.targetDetails?.author?.username}: "{r.targetDetails?.content}"</span>
                          ) : (
                            <span>User account @{r.targetDetails?.username}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Reporter */}
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-200">@{r.reporter.username}</div>
                      <div className="text-[11px] text-slate-400">{r.reporter.displayName}</div>
                    </td>

                    {/* Reason */}
                    <td className="p-3.5 max-w-xs">
                      <p className="text-slate-200 font-medium">{r.reason}</p>
                      {r.notes && (
                        <p className="text-[11px] text-slate-400 mt-0.5 font-mono italic">
                          Notes: {r.notes}
                        </p>
                      )}
                    </td>

                    {/* Status */}
                    <td className="p-3.5">
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase font-mono ${
                          r.status === "PENDING"
                            ? "border-amber-800 bg-amber-950/60 text-amber-400"
                            : r.status === "ACTION_TAKEN"
                            ? "border-red-800 bg-red-950/60 text-red-400"
                            : r.status === "REVIEWED"
                            ? "border-blue-800 bg-blue-950/60 text-blue-400"
                            : "border-slate-700 bg-slate-800/60 text-slate-400"
                        }`}
                      >
                        {r.status.replace("_", " ")}
                      </Badge>
                    </td>

                    {/* Created Date */}
                    <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>

                    {/* Reviewed By */}
                    <td className="p-3.5 text-slate-400 text-[11px]">
                      {r.reviewedBy ? (
                        <div>
                          <div className="text-slate-200">@{r.reviewedBy.username}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {r.reviewedAt ? new Date(r.reviewedAt).toLocaleDateString() : ""}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {r.status === "PENDING" && (
                          <>
                            {/* Dismiss */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                setActionModal({ report: r, targetStatus: "DISMISSED" })
                              }
                              className="h-7 px-2 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                              title="Dismiss Report"
                            >
                              <XCircle className="h-3.5 w-3.5 mr-1" /> Dismiss
                            </Button>

                            {/* Mark Reviewed */}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                setActionModal({ report: r, targetStatus: "REVIEWED" })
                              }
                              className="h-7 px-2 text-xs text-blue-400 hover:bg-blue-950/50"
                              title="Mark Reviewed"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Reviewed
                            </Button>

                            {/* Take Action (Delete Target) */}
                            {r.targetType !== "USER" ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  setActionModal({
                                    report: r,
                                    targetStatus: "ACTION_TAKEN",
                                    actionType: "DELETE_TARGET",
                                  })
                                }
                                className="h-7 px-2 text-xs text-red-400 hover:bg-red-950/50 hover:text-red-300"
                                title="Delete Target Content"
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete Content
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  setActionModal({
                                    report: r,
                                    targetStatus: "ACTION_TAKEN",
                                    actionType: "SUSPEND_USER",
                                  })
                                }
                                className="h-7 px-2 text-xs text-red-400 hover:bg-red-950/50 hover:text-red-300"
                                title="Suspend Reported User"
                              >
                                <UserX className="h-3.5 w-3.5 mr-1" /> Suspend User
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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

      {/* Action Confirmation Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-full border ${
                  actionModal.targetStatus === "ACTION_TAKEN"
                    ? "bg-red-950/80 border-red-800 text-red-400"
                    : actionModal.targetStatus === "REVIEWED"
                    ? "bg-blue-950/80 border-blue-800 text-blue-400"
                    : "bg-slate-800 border-slate-700 text-slate-400"
                }`}
              >
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  {actionModal.targetStatus === "ACTION_TAKEN"
                    ? "Enforce Moderation Action?"
                    : actionModal.targetStatus === "REVIEWED"
                    ? "Mark Report as Reviewed?"
                    : "Dismiss Incident Report?"}
                </h3>
                <p className="text-xs text-slate-400">Confirmation and resolution notes.</p>
              </div>
            </div>

            <div className="text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
              <p>
                Target: <strong>{actionModal.report.targetType}</strong> ({actionModal.report.targetId})
              </p>
              <p>
                Reason: <span className="italic text-slate-400">"{actionModal.report.reason}"</span>
              </p>
              {actionModal.actionType === "DELETE_TARGET" && (
                <p className="text-red-400 font-semibold">
                  ⚠️ This will permanently remove the reported content and record a moderation audit event.
                </p>
              )}
              {actionModal.actionType === "SUSPEND_USER" && (
                <p className="text-red-400 font-semibold">
                  ⚠️ This will immediately suspend the reported account and prevent them from logging in.
                </p>
              )}
            </div>

            {/* Optional Resolution Notes */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Resolution Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add internal moderation note..."
                rows={2}
                className="w-full rounded bg-slate-950 border border-slate-800 text-xs text-slate-200 p-2 focus:outline-none focus:border-blue-500"
              />
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
                onClick={handleExecuteReportAction}
                disabled={actionLoading}
                className={`text-xs ${
                  actionModal.targetStatus === "ACTION_TAKEN"
                    ? "bg-red-600 hover:bg-red-700 text-white"
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
