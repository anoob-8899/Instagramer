import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            Security & Administration Dashboard
          </h1>
          <p className="text-xs text-slate-400">
            System overview and security operations status
          </p>
        </div>
        <Badge variant="outline" className="border-red-800 text-red-400 bg-red-950/40">
          Admin Console
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono text-slate-400">Database Binding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-amber-400">CON 01 (Offline)</div>
            <p className="text-[11px] text-slate-500 mt-1">Bound to zero databases</p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono text-slate-400">Security Architecture</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-emerald-400">Interfaces Ready</div>
            <p className="text-[11px] text-slate-500 mt-1">Password, Lockout, Audit stubs</p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono text-slate-400">Prisma Models</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-blue-400">4 Defined</div>
            <p className="text-[11px] text-slate-500 mt-1">User, Profile, Session, AuditLog</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
