/**
 * Security Configuration Settings (CON 01 Boundary)
 * 
 * Defines architectural defaults for upcoming authentication, lockout,
 * session security, and encryption modules.
 */

export interface SecurityConfig {
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
  sessionTtlHours: number;
  minPasswordLength: number;
  requireSpecialChar: boolean;
  requireNumber: boolean;
}

export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  maxLoginAttempts: 5,
  lockoutDurationMinutes: 15,
  sessionTtlHours: 24,
  minPasswordLength: 12,
  requireSpecialChar: true,
  requireNumber: true,
};
