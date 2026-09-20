import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { User as UserIcon } from "lucide-react";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300">
            <UserIcon className="h-8 w-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl font-bold">@{username}</CardTitle>
              <Badge variant="default">Profile Shell</Badge>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              User profile placeholder for CON 01 foundation
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900 text-xs text-slate-500">
            User bio, posts, followers, and activity history will be rendered when database models are populated in future conversations.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
