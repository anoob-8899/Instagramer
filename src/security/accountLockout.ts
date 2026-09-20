import { prisma } from "@/lib/db/prisma";
import { DEFAULT_SECURITY_CONFIG } from "./securityConfig";

/**
 * Account Lockout Security Module
 * 
 * Tracks failed authentication attempts and applies temporary account lockout
 * to protect against brute-force attacks.
 */

export interface AccountLockoutStatus {
  isLocked: boolean;
  attemptsRemaining: number;
  lockedUntil?: Date;
}

export interface AccountLockoutTracker {
  recordFailedAttempt(identifier: string): Promise<AccountLockoutStatus>;
  checkStatus(identifier: string): Promise<AccountLockoutStatus>;
  resetAttempts(identifier: string): Promise<void>;
}

export class AccountLockoutService implements AccountLockoutTracker {
  private maxAttempts = DEFAULT_SECURITY_CONFIG.maxLoginAttempts;
  private lockoutDurationMinutes = DEFAULT_SECURITY_CONFIG.lockoutDurationMinutes;

  private async findUser(identifier: string) {
    const normalized = identifier.trim().toLowerCase();
    return await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: normalized, mode: "insensitive" } },
          { email: { equals: normalized, mode: "insensitive" } },
        ],
      },
    });
  }

  async checkStatus(identifier: string): Promise<AccountLockoutStatus> {
    const user = await this.findUser(identifier);
    if (!user) {
      return {
        isLocked: false,
        attemptsRemaining: this.maxAttempts,
      };
    }

    const now = new Date();

    if (user.lockedUntil && user.lockedUntil > now) {
      return {
        isLocked: true,
        attemptsRemaining: 0,
        lockedUntil: user.lockedUntil,
      };
    }

    // If lockout has expired, reset it
    if (user.lockedUntil && user.lockedUntil <= now) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
      return {
        isLocked: false,
        attemptsRemaining: this.maxAttempts,
      };
    }

    const remaining = Math.max(0, this.maxAttempts - user.failedLoginAttempts);
    return {
      isLocked: false,
      attemptsRemaining: remaining,
    };
  }

  async recordFailedAttempt(identifier: string): Promise<AccountLockoutStatus> {
    const user = await this.findUser(identifier);
    if (!user) {
      // Don't leak existence, return pseudo status
      return {
        isLocked: false,
        attemptsRemaining: this.maxAttempts - 1,
      };
    }

    const now = new Date();
    // If previous lockout expired, reset counter first
    let attempts = user.failedLoginAttempts;
    if (user.lockedUntil && user.lockedUntil <= now) {
      attempts = 0;
    }

    const newAttempts = attempts + 1;
    let lockedUntil: Date | null = null;
    let isLocked = false;

    if (newAttempts >= this.maxAttempts) {
      isLocked = true;
      lockedUntil = new Date(now.getTime() + this.lockoutDurationMinutes * 60 * 1000);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: newAttempts,
        lockedUntil: lockedUntil,
      },
    });

    return {
      isLocked,
      attemptsRemaining: Math.max(0, this.maxAttempts - newAttempts),
      lockedUntil: lockedUntil || undefined,
    };
  }

  async resetAttempts(identifier: string): Promise<void> {
    const user = await this.findUser(identifier);
    if (user && (user.failedLoginAttempts > 0 || user.lockedUntil !== null)) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });
    }
  }
}

export const accountLockoutService = new AccountLockoutService();
