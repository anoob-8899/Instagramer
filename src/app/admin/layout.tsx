import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { AdminShell } from "@/components/layout/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-white">
        <div className="max-w-md rounded-xl border border-red-800 bg-red-950/60 p-6 text-center shadow-xl">
          <h1 className="text-xl font-bold text-red-400">403 Forbidden</h1>
          <p className="mt-2 text-sm text-slate-300">
            Access Restricted: You do not have administrative privileges. Required role: <strong>ADMIN</strong>.
          </p>
        </div>
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
