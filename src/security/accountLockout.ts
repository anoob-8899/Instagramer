/**
 * Account Lockout Security Interface (CON 01 Boundary Stub)
 * 
 * Future Implementation:
 * Account lockout and rate-limiting logic will be implemented
 * during the dedicated security & authentication phase.
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
  async recordFailedAttempt(_identifier: string): Promise<AccountLockoutStatus> {
    throw new Error("Account lockout tracker unconfigured. Implementation planned for security phase.");
  }

  async checkStatus(_identifier: string): Promise<AccountLockoutStatus> {
    throw new Error("Account lockout tracker unconfigured. Implementation planned for security phase.");
  }

  async resetAttempts(_identifier: string): Promise<void> {
    throw new Error("Account lockout tracker unconfigured. Implementation planned for security phase.");
  }
}
