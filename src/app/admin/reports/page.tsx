import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            User Reports & Flagged Items
          </h1>
          <p className="text-xs text-slate-400">
            Incident reports and flagged content management
          </p>
        </div>
        <Badge variant="secondary" className="bg-slate-800 text-slate-300">
          Reports Shell
        </Badge>
      </div>

      <Card className="border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Flagged Content Queue Placeholder</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-400">
            Report resolution queue will be bound to database records in upcoming phases.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
