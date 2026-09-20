import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function CreatePostPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Create Post
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Share new content with your network
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">New Post Shell</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input label="Caption" placeholder="Write a caption..." disabled />
          <div className="flex h-32 w-full items-center justify-center rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-400">
            Image Upload Container Placeholder
          </div>
          <Button disabled className="w-full">
            Publish Post (Disabled in CON 01)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
