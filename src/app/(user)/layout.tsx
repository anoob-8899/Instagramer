import { UserShell } from "@/components/layout/UserShell";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return <UserShell>{children}</UserShell>;
}
