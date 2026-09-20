import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function MessagesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Messages
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Direct & E2EE conversation interface placeholder
          </p>
        </div>
        <Badge variant="outline">E2EE Boundary</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Direct Messaging Shell</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">
            The direct messaging layout shell. End-to-End Encryption boundary and real message exchange will be implemented in the dedicated messaging phase.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
