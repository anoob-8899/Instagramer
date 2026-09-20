import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Notifications
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Activity, mentions, and security updates
          </p>
        </div>
        <Badge variant="outline">Notifications</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Activity Stream Shell</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">
            Real-time notification feeds will be populated in upcoming conversation phases.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
