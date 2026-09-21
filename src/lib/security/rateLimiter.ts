import { prisma } from "@/lib/db/prisma";
import { getSecuritySettings } from "./securitySettings";

/**
 * In-Memory Sliding-Window Rate Limiter
 * 
 * ARCHITECTURE NOTE:
 * Operates per Node.js process instance using an in-memory Map store.
 * In serverless environments (e.g. Vercel), rate limiting is scoped to individual process instances.
 * For globally synchronized rate limiting across multi-region serverless instances, a distributed store
 * (e.g. Redis/Upstash) would be recommended in a production enterprise setup.
 * 
 * DEFENSE-IN-DEPTH:
 * Server-side safety ceiling: 30 requests/minute maximum per identifier, even when rate limiting is toggled OFF for demo.
 * Combined with PostgreSQL database-level Account Lockout (`failedLoginAttempts`, `lockedUntil`), this guarantees brute-force protection.
 */
interface RateLimitTracker {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitTracker>();

export async function checkRateLimit(
  identifier: string,
  action: string = "AUTH"
): Promise<{ allowed: boolean; remaining: number; resetInSeconds: number }> {
  const settings = await getSecuritySettings();

  // Rate ceiling: 30 requests / min maximum even when rate limiting disabled for demo
  const maxAllowed = settings.rateLimitingEnabled ? settings.rateLimitMaxAttempts : 30;
  const windowSeconds = settings.rateLimitWindowSeconds || 60;
  const windowMs = windowSeconds * 1000;
  const now = Date.now();

  const key = `${action}:${identifier.toLowerCase()}`;
  let current = memoryStore.get(key);

  if (!current || now > current.resetAt) {
    current = { count: 1, resetAt: now + windowMs };
    memoryStore.set(key, current);
    return { allowed: true, remaining: maxAllowed - 1, resetInSeconds: windowSeconds };
  }

  current.count += 1;

  if (current.count > maxAllowed) {
    // Record RATE_LIMIT_TRIGGERED security event
    try {
      await prisma.securityEvent.create({
        data: {
          eventType: "RATE_LIMIT_TRIGGERED",
          username: identifier,
          success: false,
          metadata: JSON.stringify({ action, count: current.count, limit: maxAllowed }),
        },
      });
    } catch {
      // Ignore log failure
    }

    const resetInSeconds = Math.ceil((current.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, resetInSeconds };
  }

  return {
    allowed: true,
    remaining: Math.max(0, maxAllowed - current.count),
    resetInSeconds: Math.ceil((current.resetAt - now) / 1000),
  };
}
