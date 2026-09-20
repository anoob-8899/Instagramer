import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sessionSecurityService } from "@/security/sessionSecurity";
import { securityAuditService } from "@/security/audit";
import { clearAuthCookie } from "@/lib/auth/session";
import { DEFAULT_SECURITY_CONFIG } from "@/security/securityConfig";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(DEFAULT_SECURITY_CONFIG.cookieName)?.value;

    if (token) {
      const sessionInfo = await sessionSecurityService.validateToken(token);
      if (sessionInfo.userId) {
        await securityAuditService.logEvent({
          actorId: sessionInfo.userId,
          action: "LOGOUT",
        });
      }
      await sessionSecurityService.revokeSessionByToken(token);
    }

    const response = NextResponse.json({ message: "Logged out successfully." });
    clearAuthCookie(response);
    return response;
  } catch (error) {
    console.error("Logout error:", error);
    const response = NextResponse.json({ message: "Logged out." });
    clearAuthCookie(response);
    return response;
  }
}
