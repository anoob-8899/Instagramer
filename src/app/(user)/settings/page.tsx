import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Settings, Shield, Bell, Lock } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6 py-2">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Account Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Manage your account preferences and security controls
        </p>
      </div>

      <Card className="rounded-2xl border-slate-200/90 shadow-sm dark:border-slate-800">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-200">
            Account Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Security & Session Protection
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Argon2id hashing & HTTP-only cookies active
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                Active
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Account Lockout Safeguard
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Rate-limits brute-force attempts automatically
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                Enforced
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Notification Preferences
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Email & push notification toggles
                  </p>
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                Available in CON 05
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
