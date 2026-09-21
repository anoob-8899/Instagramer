import { prisma } from "@/lib/db/prisma";

export interface SecuritySettingsState {
  rateLimitingEnabled: boolean;
  accountLockoutEnabled: boolean;
  classroomModeEnabled: boolean;
  messageSecurityEnabled: boolean;
  messageRepresentation: "PROTECTED" | "SIMULATED_EXPOSED";
  maxFailedAttempts: number;
  lockoutDurationSeconds: number;
  rateLimitWindowSeconds: number;
  rateLimitMaxAttempts: number;
}

const DEFAULT_SETTINGS: SecuritySettingsState = {
  rateLimitingEnabled: true,
  accountLockoutEnabled: true,
  classroomModeEnabled: false,
  messageSecurityEnabled: true,
  messageRepresentation: "PROTECTED",
  maxFailedAttempts: 5,
  lockoutDurationSeconds: 900,
  rateLimitWindowSeconds: 60,
  rateLimitMaxAttempts: 10,
};

export async function getSecuritySettings(): Promise<SecuritySettingsState> {
  try {
    const records = await prisma.securitySetting.findMany();
    const map = new Map<string, string>();
    records.forEach((r) => map.set(r.key, r.value));

    return {
      rateLimitingEnabled: map.has("RATE_LIMITING_ENABLED")
        ? map.get("RATE_LIMITING_ENABLED") === "true"
        : DEFAULT_SETTINGS.rateLimitingEnabled,
      accountLockoutEnabled: map.has("ACCOUNT_LOCKOUT_ENABLED")
        ? map.get("ACCOUNT_LOCKOUT_ENABLED") === "true"
        : DEFAULT_SETTINGS.accountLockoutEnabled,
      classroomModeEnabled: map.has("CLASSROOM_MODE_ENABLED")
        ? map.get("CLASSROOM_MODE_ENABLED") === "true"
        : DEFAULT_SETTINGS.classroomModeEnabled,
      messageSecurityEnabled: map.has("MESSAGE_SECURITY_ENABLED")
        ? map.get("MESSAGE_SECURITY_ENABLED") === "true"
        : DEFAULT_SETTINGS.messageSecurityEnabled,
      messageRepresentation: map.has("MESSAGE_SECURITY_REPRESENTATION") &&
        map.get("MESSAGE_SECURITY_REPRESENTATION") === "SIMULATED_EXPOSED"
        ? "SIMULATED_EXPOSED"
        : "PROTECTED",
      maxFailedAttempts: map.has("MAX_FAILED_ATTEMPTS")
        ? parseInt(map.get("MAX_FAILED_ATTEMPTS")!, 10) || 5
        : DEFAULT_SETTINGS.maxFailedAttempts,
      lockoutDurationSeconds: map.has("LOCKOUT_DURATION_SECONDS")
        ? parseInt(map.get("LOCKOUT_DURATION_SECONDS")!, 10) || 900
        : DEFAULT_SETTINGS.lockoutDurationSeconds,
      rateLimitWindowSeconds: map.has("RATE_LIMIT_WINDOW_SECONDS")
        ? parseInt(map.get("RATE_LIMIT_WINDOW_SECONDS")!, 10) || 60
        : DEFAULT_SETTINGS.rateLimitWindowSeconds,
      rateLimitMaxAttempts: map.has("RATE_LIMIT_MAX_ATTEMPTS")
        ? parseInt(map.get("RATE_LIMIT_MAX_ATTEMPTS")!, 10) || 10
        : DEFAULT_SETTINGS.rateLimitMaxAttempts,
    };
  } catch (err) {
    console.error("Error loading security settings:", err);
    return DEFAULT_SETTINGS;
  }
}

export async function updateSecuritySettings(
  partial: Partial<SecuritySettingsState>
): Promise<SecuritySettingsState> {
  const updates: Array<{ key: string; value: string }> = [];

  if (partial.rateLimitingEnabled !== undefined) {
    updates.push({ key: "RATE_LIMITING_ENABLED", value: String(partial.rateLimitingEnabled) });
  }
  if (partial.accountLockoutEnabled !== undefined) {
    updates.push({ key: "ACCOUNT_LOCKOUT_ENABLED", value: String(partial.accountLockoutEnabled) });
  }
  if (partial.classroomModeEnabled !== undefined) {
    updates.push({ key: "CLASSROOM_MODE_ENABLED", value: String(partial.classroomModeEnabled) });
  }
  if (partial.messageSecurityEnabled !== undefined) {
    updates.push({ key: "MESSAGE_SECURITY_ENABLED", value: String(partial.messageSecurityEnabled) });
  }
  if (partial.messageRepresentation !== undefined) {
    updates.push({ key: "MESSAGE_SECURITY_REPRESENTATION", value: partial.messageRepresentation });
  }
  if (partial.maxFailedAttempts !== undefined) {
    updates.push({ key: "MAX_FAILED_ATTEMPTS", value: String(partial.maxFailedAttempts) });
  }
  if (partial.lockoutDurationSeconds !== undefined) {
    updates.push({ key: "LOCKOUT_DURATION_SECONDS", value: String(partial.lockoutDurationSeconds) });
  }
  if (partial.rateLimitWindowSeconds !== undefined) {
    updates.push({ key: "RATE_LIMIT_WINDOW_SECONDS", value: String(partial.rateLimitWindowSeconds) });
  }
  if (partial.rateLimitMaxAttempts !== undefined) {
    updates.push({ key: "RATE_LIMIT_MAX_ATTEMPTS", value: String(partial.rateLimitMaxAttempts) });
  }

  for (const item of updates) {
    await prisma.securitySetting.upsert({
      where: { key: item.key },
      update: { value: item.value },
      create: { key: item.key, value: item.value },
    });
  }

  return getSecuritySettings();
}
