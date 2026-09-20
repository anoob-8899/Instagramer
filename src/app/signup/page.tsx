import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/Card";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-black text-blue-600 dark:text-blue-400">
            Instagramer
          </CardTitle>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Create your account to join the network
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input label="Full Name" placeholder="Jane Doe" disabled />
          <Input label="Username" placeholder="janedoe" disabled />
          <Input label="Email" placeholder="jane@example.com" disabled />
          <Input label="Password" type="password" placeholder="••••••••••••" disabled />
          <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <strong>CON 01 Notice:</strong> User registration foundation. Password hashing and database persistence will be implemented in future conversation phases.
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Link href="/feed" className="w-full">
            <Button className="w-full">Create Account (Enter Demo Shell)</Button>
          </Link>
          <p className="text-xs text-center text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:underline dark:text-blue-400 font-semibold">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
