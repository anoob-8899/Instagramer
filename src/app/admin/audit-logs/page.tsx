import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function AdminAuditLogsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            System Audit Trail
          </h1>
          <p className="text-xs text-slate-400">
            Immutable log viewer for administrative actions and security events
          </p>
        </div>
        <Badge variant="secondary" className="bg-slate-800 text-slate-300">
          Audit Log Shell
        </Badge>
      </div>

      <Card className="border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Audit Event Log Viewer Placeholder</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-400">
            AuditLog model table viewer will be connected when audit event logging is active in future phases.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
