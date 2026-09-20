import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function AdminSecurityPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            Security & Threat Monitoring
          </h1>
          <p className="text-xs text-slate-400">
            Real-time security telemetry, lockout monitoring, and security events
          </p>
        </div>
        <Badge variant="outline" className="border-red-800 text-red-400 bg-red-950/40">
          Security Center
        </Badge>
      </div>

      <Card className="border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Security Telemetry Console Placeholder</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-400">
            Security monitoring graphs, attack telemetry, and lockout overrides will be connected in future security phases.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
