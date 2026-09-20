import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function RootPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md space-y-6">
        <h1 className="text-4xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400">
          Instagramer
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Welcome to Instagramer. Experience modern social connectivity, direct messaging, and rich application experiences.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row justify-center">
          <Link href="/feed">
            <Button size="lg" className="w-full sm:w-auto">
              Open Social Feed
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Sign In
            </Button>
          </Link>
          <Link href="/admin">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              Admin Portal
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
