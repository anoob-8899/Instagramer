import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function AdminPostsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            Content Moderation Console
          </h1>
          <p className="text-xs text-slate-400">
            Post review queue and content moderation controls
          </p>
        </div>
        <Badge variant="secondary" className="bg-slate-800 text-slate-300">
          Moderation Shell
        </Badge>
      </div>

      <Card className="border-slate-800 bg-slate-900 text-slate-100">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Post Queue Placeholder</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-400">
            Content moderation workflows will be connected in future moderation phases.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
