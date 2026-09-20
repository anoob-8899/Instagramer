/**
 * Password Hashing Security Interface (CON 01 Boundary Stub)
 * 
 * Future Implementation:
 * Password hashing using Argon2id / bcrypt will be integrated
 * during the dedicated authentication implementation phase.
 * 
 * NO passwords or hashes are processed or stored in CON 01.
 */

export interface PasswordHashProvider {
  hashPassword(plainTextPassword: string): Promise<string>;
  verifyPassword(plainTextPassword: string, hash: string): Promise<boolean>;
}

export class PasswordHashingService implements PasswordHashProvider {
  async hashPassword(_plainTextPassword: string): Promise<string> {
    throw new Error("Password hashing service unconfigured. Implementation planned for authentication phase.");
  }

  async verifyPassword(_plainTextPassword: string, _hash: string): Promise<boolean> {
    throw new Error("Password verification service unconfigured. Implementation planned for authentication phase.");
  }
}
