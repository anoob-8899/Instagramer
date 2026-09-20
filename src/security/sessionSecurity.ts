import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import { DEFAULT_SECURITY_CONFIG } from "./securityConfig";

/**
 * Session Security Module
 * 
 * Manages server-side sessions, secure random token generation,
 * session token hashing, expiration validation, and session revocation.
 */

export interface ValidatedSession {
  sessionId: string;
  userId: string;
  isValid: boolean;
  expiresAt: Date;
}

export interface SessionSecurityProvider {
  createSession(userId: string): Promise<{ rawToken: string; expiresAt: Date; sessionId: string }>;
  validateToken(rawToken: string): Promise<ValidatedSession>;
  revokeSession(sessionId: string): Promise<void>;
  revokeSessionByToken(rawToken: string): Promise<void>;
}

export class SessionSecurityService implements SessionSecurityProvider {
  private sessionTtlHours = DEFAULT_SECURITY_CONFIG.sessionTtlHours;

  private hashToken(rawToken: string): string {
    return crypto.createHash("sha256").update(rawToken).digest("hex");
  }

  async createSession(userId: string): Promise<{ rawToken: string; expiresAt: Date; sessionId: string }> {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const sessionToken = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + this.sessionTtlHours * 60 * 60 * 1000);

    const session = await prisma.session.create({
      data: {
        userId,
        sessionToken,
        expiresAt,
      },
    });

    return {
      rawToken,
      expiresAt,
      sessionId: session.id,
    };
  }

  async validateToken(rawToken: string): Promise<ValidatedSession> {
    if (!rawToken || rawToken.trim() === "") {
      return { sessionId: "", userId: "", isValid: false, expiresAt: new Date(0) };
    }

    const sessionToken = this.hashToken(rawToken);
    const session = await prisma.session.findUnique({
      where: { sessionToken },
    });

    if (!session) {
      return { sessionId: "", userId: "", isValid: false, expiresAt: new Date(0) };
    }

    const now = new Date();
    if (session.expiresAt <= now) {
      // Clean up expired session
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      return { sessionId: session.id, userId: session.userId, isValid: false, expiresAt: session.expiresAt };
    }

    return {
      sessionId: session.id,
      userId: session.userId,
      isValid: true,
      expiresAt: session.expiresAt,
    };
  }

  async revokeSession(sessionId: string): Promise<void> {
    if (!sessionId) return;
    await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
  }

  async revokeSessionByToken(rawToken: string): Promise<void> {
    if (!rawToken) return;
    const sessionToken = this.hashToken(rawToken);
    await prisma.session.deleteMany({ where: { sessionToken } }).catch(() => {});
  }
}

export const sessionSecurityService = new SessionSecurityService();
