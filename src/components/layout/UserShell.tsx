"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { DesktopNav, NavUserState } from "@/components/navigation/DesktopNav";
import { MobileNav } from "@/components/navigation/MobileNav";

export interface UserShellProps {
  children: React.ReactNode;
}

export const UserShell: React.FC<UserShellProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<NavUserState | null>(null);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications/unread-count");
      if (res.ok) {
        const data = await res.json();
        setUnreadNotificationsCount(data.count ?? 0);
      }
    } catch {
      // Gracefully ignore fetch errors
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.user) {
          setCurrentUser({
            username: data.user.username,
            email: data.user.email,
            role: data.user.role,
            displayName: data.user.profile?.displayName || null,
            avatarUrl: data.user.profile?.avatarUrl || null,
          });
          fetchUnreadCount();
        }
      })
      .catch(() => {
        // Gracefully handle unauthenticated state (401)
      });

    return () => {
      isMounted = false;
    };
  }, [fetchUnreadCount]);

  // Refresh unread count on navigation or custom notification event
  useEffect(() => {
    if (currentUser) {
      fetchUnreadCount();
    }

    const handleNotificationUpdate = () => {
      fetchUnreadCount();
    };

    window.addEventListener("notification-updated", handleNotificationUpdate);

    // Subtle 30s polling when document is visible
    const interval = setInterval(() => {
      if (document.visibilityState === "visible" && currentUser) {
        fetchUnreadCount();
      }
    }, 30000);

    return () => {
      window.removeEventListener("notification-updated", handleNotificationUpdate);
      clearInterval(interval);
    };
  }, [currentUser, pathname, fetchUnreadCount]);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Network error fallback
    } finally {
      setCurrentUser(null);
      setUnreadNotificationsCount(0);
      setIsLoggingOut(false);
      router.push("/login");
      router.refresh();
    }
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 md:flex-row antialiased">
      {/* Desktop Navigation Sidebar */}
      <DesktopNav
        currentUser={currentUser}
        unreadNotificationsCount={unreadNotificationsCount}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />

      {/* Mobile Header & Bottom Navigation */}
      <MobileNav
        currentUser={currentUser}
        unreadNotificationsCount={unreadNotificationsCount}
        onLogout={handleLogout}
        isLoggingOut={isLoggingOut}
      />

      {/* Main Content Area */}
      <main
        className="flex-1 overflow-x-hidden overflow-y-auto px-4 py-4 pb-24 sm:px-6 md:py-6 md:pb-6"
        role="main"
      >
        <div className="mx-auto w-full max-w-4xl">{children}</div>
      </main>
    </div>
  );
};
