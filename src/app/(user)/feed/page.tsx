import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function FeedPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Feed
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Recent updates and posts from community creators
          </p>
        </div>
        <Badge variant="outline">CON 01 Shell</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium text-slate-600 dark:text-slate-300">
            Application Foundation Active
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            This feed shell represents the social landing surface for Instagramer.
          </p>
          <div className="rounded-md bg-slate-100 p-3 text-xs font-mono text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            Status: Foundation Ready • Zero DB Connection • Postgres binding in CON 02
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
