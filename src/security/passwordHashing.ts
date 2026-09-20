import * as argon2 from "argon2";

/**
 * Password Hashing Security Module (Argon2id)
 * 
 * Provides secure password hashing and verification using Argon2id.
 * Passwords are never stored or logged in plain text.
 */

export interface PasswordHashProvider {
  hashPassword(plainTextPassword: string): Promise<string>;
  verifyPassword(plainTextPassword: string, hash: string): Promise<boolean>;
}

export const ARGON2ID_CONFIG: argon2.HashOptions = {
  type: argon2.argon2id,
  memoryCost: 2 ** 16, // 64 MB (65536 KiB)
  timeCost: 3,        // 3 iterations
  parallelism: 1,     // 1 thread
};

export class PasswordHashingService implements PasswordHashProvider {
  async hashPassword(plainTextPassword: string): Promise<string> {
    if (!plainTextPassword || plainTextPassword.length === 0) {
      throw new Error("Password cannot be empty");
    }
    return await argon2.hash(plainTextPassword, ARGON2ID_CONFIG);
  }

  async verifyPassword(plainTextPassword: string, hash: string): Promise<boolean> {
    if (!plainTextPassword || !hash) {
      return false;
    }
    try {
      return await argon2.verify(hash, plainTextPassword);
    } catch {
      return false;
    }
  }

  /**
   * Parses the public parameters encoded within an Argon2id formatted string
   * without exposing secret keying material.
   */
  parseHashMetadata(hashString: string): {
    algorithm: string;
    version?: number;
    memoryCostKiB?: number;
    timeCost?: number;
    parallelism?: number;
    validFormat: boolean;
  } {
    if (!hashString || !hashString.startsWith("$argon2id$")) {
      return { algorithm: "unknown", validFormat: false };
    }

    try {
      const parts = hashString.split("$");
      // Format: $argon2id$v=19$m=65536,t=3,p=1$salt$hash
      const algorithm = parts[1] || "argon2id";
      let version: number | undefined;
      let memoryCostKiB: number | undefined;
      let timeCost: number | undefined;
      let parallelism: number | undefined;

      for (const part of parts) {
        if (part.startsWith("v=")) {
          version = parseInt(part.replace("v=", ""), 10);
        } else if (part.includes("m=") && part.includes("t=") && part.includes("p=")) {
          const params = part.split(",");
          for (const param of params) {
            if (param.startsWith("m=")) memoryCostKiB = parseInt(param.replace("m=", ""), 10);
            if (param.startsWith("t=")) timeCost = parseInt(param.replace("t=", ""), 10);
            if (param.startsWith("p=")) parallelism = parseInt(param.replace("p=", ""), 10);
          }
        }
      }

      return {
        algorithm,
        version,
        memoryCostKiB,
        timeCost,
        parallelism,
        validFormat: true,
      };
    } catch {
      return { algorithm: "argon2id", validFormat: true };
    }
  }
}

export const passwordHashingService = new PasswordHashingService();
