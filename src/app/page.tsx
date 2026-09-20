import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Camera, ArrowRight, Shield } from "lucide-react";

export default function RootPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center dark:bg-slate-950">
      <div className="max-w-md space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 text-white shadow-lg">
          <Camera className="h-8 w-8 stroke-[1.8]" />
        </div>

        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Instagramer
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            A secure full-stack social web application. Share moments, explore creative portfolios, and connect with people.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row justify-center">
          <Link href="/feed" className="w-full sm:w-auto">
            <Button size="lg" className="w-full gap-2 shadow-sm">
              <span>Open Social Feed</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full">
              Sign In
            </Button>
          </Link>
          <Link href="/admin" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full gap-1.5 text-xs">
              <Shield className="h-3.5 w-3.5" />
              <span>Admin</span>
            </Button>
          </Link>
        </div>

        <p className="text-[11px] text-slate-400 dark:text-slate-600">
          CON 04 &bull; Powered by Next.js App Router, Tailwind CSS & Argon2id Security
        </p>
      </div>
    </div>
  );
}
