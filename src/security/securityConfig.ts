/**
 * Security Configuration Settings
 * 
 * Centralized security parameters for authentication, password policies,
 * account lockout, session management, and rate limiting.
 */

export interface SecurityConfig {
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
  sessionTtlHours: number;
  minPasswordLength: number;
  cookieName: string;
}

export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  maxLoginAttempts: 5,
  lockoutDurationMinutes: 15,
  sessionTtlHours: 24,
  minPasswordLength: 8,
  cookieName: "sb_auth_token",
};
