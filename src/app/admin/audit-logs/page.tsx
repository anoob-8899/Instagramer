"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Shield,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Clock,
  User,
  Info,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface AuditLogItem {
  id: string;
  action: string;
  createdAt: string;
  actorId: string | null;
  actorUsername: string | null;
  actorRole: string | null;
  metadata: any;
}

const COMMON_ACTIONS = [
  "ALL",
  "LOGIN_SUCCESS",
  "LOGIN_FAILURE",
  "ACCOUNT_LOCKED",
  "USER_ROLE_CHANGED",
  "USER_SUSPENDED",
  "USER_UNSUSPENDED",
  "USER_UNLOCKED",
  "POST_MODERATED",
  "COMMENT_MODERATED",
  "REPORT_CREATED",
  "REPORT_REVIEWED",
  "REPORT_DISMISSED",
  "REPORT_ACTION_TAKEN",
];

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [selectedAction, setSelectedAction] = useState("ALL");
  const [actorSearch, setActorSearch] = useState("");
  const [actorInput, setActorInput] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Metadata details view modal
  const [inspectLog, setInspectLog] = useState<AuditLogItem | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });

      if (selectedAction !== "ALL") params.set("action", selectedAction);
      if (actorSearch) params.set("actor", actorSearch);

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch audit logs");
      }

      const data = await res.json();
      setLogs(data.logs);
      setTotalPages(data.pagination.totalPages || 1);
      setTotalCount(data.pagination.total || 0);
    } catch (err: any) {
      setError(err.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [page, selectedAction, actorSearch]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleActorSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setActorSearch(actorInput.trim());
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes("FAILURE") || action.includes("LOCKED") || action.includes("SUSPENDED")) {
      return "border-red-800 bg-red-950/60 text-red-400";
    }
    if (action.includes("MODERATED") || action.includes("ROLE") || action.includes("ACTION_TAKEN")) {
      return "border-amber-800 bg-amber-950/60 text-amber-400";
    }
    if (action.includes("SUCCESS") || action.includes("UNSUSPENDED") || action.includes("UNLOCKED")) {
      return "border-emerald-800 bg-emerald-950/60 text-emerald-400";
    }
    return "border-blue-800 bg-blue-950/60 text-blue-400";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Shield className="h-6 w-6 text-red-500" />
            Security Audit Trail
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable log trail of administrative actions, authentication events, and moderation resolutions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-slate-700 text-slate-300">
            Total Events: {totalCount}
          </Badge>
          <Button
            size="sm"
            variant="secondary"
            onClick={fetchLogs}
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

      {/* Filters Bar */}
      <Card className="border-slate-800 bg-slate-900 text-slate-100">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Actor Search */}
            <form onSubmit={handleActorSearchSubmit} className="flex flex-1 gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Filter by Actor username or user ID..."
                  value={actorInput}
                  onChange={(e) => setActorInput(e.target.value)}
                  className="pl-9 bg-slate-950 border-slate-800 text-xs text-slate-100 placeholder:text-slate-500"
                />
              </div>
              <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs px-4">
                Filter Actor
              </Button>
              {actorSearch && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setActorSearch("");
                    setActorInput("");
                    setPage(1);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Clear
                </Button>
              )}
            </form>

            {/* Action Select Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Action:</span>
              <select
                value={selectedAction}
                onChange={(e) => {
                  setSelectedAction(e.target.value);
                  setPage(1);
                }}
                className="h-8 rounded bg-slate-950 border border-slate-800 text-xs text-slate-200 px-2 focus:outline-none focus:border-blue-500"
              >
                {COMMON_ACTIONS.map((act) => (
                  <option key={act} value={act}>
                    {act}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card className="border-slate-800 bg-slate-900 text-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase font-mono text-[10px]">
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Actor</th>
                <th className="p-3.5">Metadata Preview</th>
                <th className="p-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-sans">
                    Loading immutable audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 font-sans">
                    No audit records matching query found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Timestamp */}
                    <td className="p-3.5 text-slate-300 text-[11px] whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-slate-500" />
                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="p-3.5">
                      <Badge variant="outline" className={`text-[10px] ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </Badge>
                    </td>

                    {/* Actor */}
                    <td className="p-3.5 text-slate-300">
                      {log.actorUsername ? (
                        <div className="font-sans">
                          <span className="font-semibold text-slate-200">@{log.actorUsername}</span>
                          {log.actorRole && (
                            <span className="ml-1.5 text-[10px] text-slate-400 font-mono">({log.actorRole})</span>
                          )}
                        </div>
                      ) : log.actorId ? (
                        <span className="text-slate-400">{log.actorId.slice(0, 10)}...</span>
                      ) : (
                        <span className="text-slate-600">System / Anonymous</span>
                      )}
                    </td>

                    {/* Metadata Preview */}
                    <td className="p-3.5 max-w-md truncate text-slate-400 text-[11px]">
                      {log.metadata ? (
                        typeof log.metadata === "object" ? (
                          JSON.stringify(log.metadata)
                        ) : (
                          String(log.metadata)
                        )
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* Details Action */}
                    <td className="p-3.5 text-right font-sans">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setInspectLog(log)}
                        className="h-7 px-2 text-xs text-blue-400 hover:bg-blue-950/50"
                      >
                        <Info className="h-3.5 w-3.5 mr-1" /> View JSON
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-sans">
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

      {/* Inspect JSON Metadata Modal */}
      {inspectLog && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 font-sans">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-xs ${getActionBadgeColor(inspectLog.action)}`}>
                  {inspectLog.action}
                </Badge>
                <span className="text-xs text-slate-400 font-mono">
                  {new Date(inspectLog.createdAt).toLocaleString()}
                </span>
              </div>
              <button onClick={() => setInspectLog(null)} className="text-slate-400 hover:text-slate-200">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="text-xs space-y-2 text-slate-300">
              <div>
                <span className="text-slate-500">Event ID:</span>{" "}
                <span className="font-mono text-slate-300">{inspectLog.id}</span>
              </div>
              <div>
                <span className="text-slate-500">Actor:</span>{" "}
                <span className="font-semibold text-slate-200">
                  {inspectLog.actorUsername ? `@${inspectLog.actorUsername}` : inspectLog.actorId || "System"}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Sanitized Event Metadata</label>
              <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-60">
                {JSON.stringify(inspectLog.metadata || {}, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setInspectLog(null)}
                className="text-xs bg-slate-800 text-slate-200 hover:bg-slate-700"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
