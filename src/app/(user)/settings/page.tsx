import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Account preferences, security controls, and notifications
          </p>
        </div>
        <Badge variant="secondary">User Settings</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Account Settings Shell</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">
            User preference management controls will be connected to persistence in upcoming phases.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
