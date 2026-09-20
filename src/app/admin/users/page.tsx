import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            User Management Console
          </h1>
          <p className="text-xs text-slate-400">
            User directory, role assignments, and account status controls
          </p>
        </div>
        <Badge variant="secondary" className="bg-slate-800 text-slate-300">
          User Management Shell
        </Badge>
      </div>

      <Card className="border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">User Directory Table Placeholder</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-400">
            User CRUD, role management, and lockout controls will be populated when the database is connected in future phases.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
