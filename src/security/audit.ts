import { prisma } from "@/lib/db/prisma";

/**
 * Security Audit Logger Module
 * 
 * Records security-relevant authentication and administrative events in AuditLog table.
 * Passwords, session tokens, and secrets are strictly excluded.
 */

export interface SecurityAuditEvent {
  actorId?: string;
  action: string;
  metadata?: Record<string, unknown>;
  timestamp?: Date;
}

export interface SecurityAuditLogger {
  logEvent(event: Omit<SecurityAuditEvent, "timestamp">): Promise<void>;
}

const SENSITIVE_KEYS = [
  "password",
  "plainpassword",
  "passwordhash",
  "sessiontoken",
  "secret",
  "token",
  "authorization",
  "database_url",
  "privatekey",
  "apikey",
  "bearer",
  "access_token",
  "refresh_token",
  "cookie",
];

export function sanitizeMetadataValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeMetadataValue(item));
  }
  if (typeof value === "object") {
    const sanitizedObj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const lowerKey = k.toLowerCase().replace(/[-_]/g, "");
      if (SENSITIVE_KEYS.some((s) => lowerKey.includes(s.replace(/[-_]/g, "")))) {
        sanitizedObj[k] = "[REDACTED]";
      } else {
        sanitizedObj[k] = sanitizeMetadataValue(v);
      }
    }
    return sanitizedObj;
  }
  return String(value);
}

export function sanitizeMetadata(meta?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!meta) return undefined;
  return sanitizeMetadataValue(meta) as Record<string, unknown>;
}

export class SecurityAuditService implements SecurityAuditLogger {
  async logEvent(event: Omit<SecurityAuditEvent, "timestamp">): Promise<void> {
    try {
      const sanitizedMeta = sanitizeMetadata(event.metadata);
      await prisma.auditLog.create({
        data: {
          actorId: event.actorId || null,
          action: event.action,
          metadata: sanitizedMeta ? JSON.stringify(sanitizedMeta) : null,
        },
      });
    } catch (err) {
      console.error("Failed to write audit log:", err);
    }
  }
}

export const securityAuditService = new SecurityAuditService();
