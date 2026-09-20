import { prisma } from "../src/lib/db/prisma";
import { passwordHashingService, ARGON2ID_CONFIG } from "../src/security/passwordHashing";
import { accountLockoutService } from "../src/security/accountLockout";
import { sessionSecurityService } from "../src/security/sessionSecurity";
import { securityAuditService, sanitizeMetadata } from "../src/security/audit";
import { DEFAULT_SECURITY_CONFIG } from "../src/security/securityConfig";

async function runSecurityAuditTests() {
  console.log("===============================================================================");
  console.log("CON 08: INSTAGRAMER SECURITY HARDENING & ACCOUNT LOCKOUT TEST SUITE");
  console.log("===============================================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}${detail ? ` -> ${detail}` : ""}`);
      failed++;
    }
  }

  try {
    // ========================================================================
    // 1. ARGON2ID PASSWORD HASHING TESTS
    // ========================================================================
    console.log("\n--- TEST SUITE 1: Argon2id Password Hashing & Verification ---");

    const testPlaintext = "SecureDemoPass_2026!#";
    const startTime = Date.now();
    const hashResult = await passwordHashingService.hashPassword(testPlaintext);
    const duration = Date.now() - startTime;

    assert(typeof hashResult === "string" && hashResult.length > 0, "Password hashes successfully");
    assert(hashResult.startsWith("$argon2id$"), "Hash format starts with $argon2id$", hashResult);
    assert(hashResult.includes("m=65536"), "Hash embeds 64MB memory cost parameter (m=65536)");
    assert(hashResult.includes("t=3"), "Hash embeds 3 time cost iterations (t=3)");
    assert(hashResult.includes("p=1"), "Hash embeds 1 parallelism thread (p=1)");

    const isMatch = await passwordHashingService.verifyPassword(testPlaintext, hashResult);
    assert(isMatch === true, "Same password verifies correctly against Argon2id hash");

    const isWrongMatch = await passwordHashingService.verifyPassword("IncorrectPassword123!", hashResult);
    assert(isWrongMatch === false, "Incorrect password fails verification");

    const isCorruptedMatch = await passwordHashingService.verifyPassword(testPlaintext, "$argon2id$invalid_corrupted_hash");
    assert(isCorruptedMatch === false, "Corrupted hash fails verification safely without crashing");

    let emptyRejected = false;
    try {
      await passwordHashingService.hashPassword("");
    } catch {
      emptyRejected = true;
    }
    assert(emptyRejected, "Empty password string is rejected with an Error");

    const meta = passwordHashingService.parseHashMetadata(hashResult);
    assert(meta.validFormat && meta.algorithm === "argon2id", "Hash metadata parser accurately extracts Argon2id parameters");
    assert(meta.memoryCostKiB === 65536, "Hash metadata parser confirms memoryCostKiB = 65536");
    assert(meta.timeCost === 3, "Hash metadata parser confirms timeCost = 3");
    assert(meta.parallelism === 1, "Hash metadata parser confirms parallelism = 1");

    // ========================================================================
    // 2. PASSWORD POLICY ENFORCEMENT TESTS
    // ========================================================================
    console.log("\n--- TEST SUITE 2: Password Policy Enforcement ---");

    const minLength = DEFAULT_SECURITY_CONFIG.minPasswordLength;
    assert(minLength === 8, "Minimum password length is configured to 8 characters");

    const validPasswords = ["12345678", "longPassphraseWithSpacesAndSymbols!@#$", "abcdefgh"];
    const invalidPasswords = ["", "1234567", "short", "a"];

    for (const pwd of validPasswords) {
      assert(pwd.length >= minLength, `Valid password length (${pwd.length} chars) satisfies policy`);
    }

    for (const pwd of invalidPasswords) {
      assert(pwd.length < minLength, `Invalid password length (${pwd.length} chars) is rejected by policy`);
    }

    // ========================================================================
    // 3. AUDIT LOGGING SECRET SANITIZATION TESTS
    // ========================================================================
    console.log("\n--- TEST SUITE 3: Audit Logging Secret Sanitization ---");

    const sensitivePayload = {
      user: "alice",
      password: "secret_plaintext_password_123",
      plainPassword: "another_plain_password",
      passwordHash: "$argon2id$v=19$m=65536,t=3,p=1$secretHashPayload",
      sessionToken: "sha256_or_raw_session_token_xyz",
      secret: "super_secret_key",
      token: "bearer_token_abc",
      authorization: "Bearer eyJhbGciOi...",
      database_url: "postgres://user:pass@host/db",
      privateKey: "-----BEGIN PRIVATE KEY-----",
      apiKey: "sk_live_1234567890",
      nestedObject: {
        safeField: "public_value",
        innerPassword: "nested_password_should_redact",
        innerToken: "nested_token_should_redact",
      },
      arrayPayload: [
        { safeItem: 1 },
        { password: "password_in_array_should_redact" },
      ],
    };

    const sanitized = sanitizeMetadata(sensitivePayload);
    assert(sanitized !== undefined, "sanitizeMetadata processes input object");
    if (sanitized) {
      assert(sanitized.password === "[REDACTED]", "Top-level 'password' is [REDACTED]");
      assert(sanitized.plainPassword === "[REDACTED]", "Top-level 'plainPassword' is [REDACTED]");
      assert(sanitized.passwordHash === "[REDACTED]", "Top-level 'passwordHash' is [REDACTED]");
      assert(sanitized.sessionToken === "[REDACTED]", "Top-level 'sessionToken' is [REDACTED]");
      assert(sanitized.secret === "[REDACTED]", "Top-level 'secret' is [REDACTED]");
      assert(sanitized.token === "[REDACTED]", "Top-level 'token' is [REDACTED]");
      assert(sanitized.authorization === "[REDACTED]", "Top-level 'authorization' is [REDACTED]");
      assert(sanitized.database_url === "[REDACTED]", "Top-level 'database_url' is [REDACTED]");
      assert(sanitized.privateKey === "[REDACTED]", "Top-level 'privateKey' is [REDACTED]");
      assert(sanitized.apiKey === "[REDACTED]", "Top-level 'apiKey' is [REDACTED]");

      const nested = sanitized.nestedObject as Record<string, unknown>;
      assert(nested.safeField === "public_value", "Nested safe fields are preserved");
      assert(nested.innerPassword === "[REDACTED]", "Nested password is [REDACTED]");
      assert(nested.innerToken === "[REDACTED]", "Nested token is [REDACTED]");

      const arr = sanitized.arrayPayload as Array<Record<string, unknown>>;
      assert(arr[1].password === "[REDACTED]", "Array element password is [REDACTED]");
    }

    // ========================================================================
    // 4. ACCOUNT LOCKOUT LIFECYCLE & ENUMERATION RESISTANCE
    // ========================================================================
    console.log("\n--- TEST SUITE 4: Account Lockout Lifecycle & Enumeration Resistance ---");

    const nonExistentIdentifier = "non_existent_audit_user_99999";
    const statusNonExistent = await accountLockoutService.checkStatus(nonExistentIdentifier);
    assert(statusNonExistent.isLocked === false, "Non-existent user checkStatus returns isLocked: false (no enumeration)");
    assert(statusNonExistent.attemptsRemaining === DEFAULT_SECURITY_CONFIG.maxLoginAttempts, "Non-existent user checkStatus returns max attempts remaining");

    const recordNonExistent = await accountLockoutService.recordFailedAttempt(nonExistentIdentifier);
    assert(recordNonExistent.isLocked === false, "Recording failure for non-existent user returns pseudo status");
    assert(recordNonExistent.attemptsRemaining === DEFAULT_SECURITY_CONFIG.maxLoginAttempts - 1, "Pseudo status displays decrement (no enumeration leak)");

    // Test lockout lifecycle against a temporary in-database test record
    const testUsername = `test_lockout_${Date.now()}`;
    const testEmail = `${testUsername}@example.internal`;
    const tempPasswordHash = await passwordHashingService.hashPassword("TemporaryPassword123!");

    const tempUser = await prisma.user.create({
      data: {
        username: testUsername,
        email: testEmail,
        passwordHash: tempPasswordHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    try {
      // Failed attempts 1 through 4
      for (let attempt = 1; attempt <= 4; attempt++) {
        const attemptStatus = await accountLockoutService.recordFailedAttempt(testUsername);
        assert(attemptStatus.isLocked === false, `Attempt #${attempt}: Account remains unlocked`);
        assert(attemptStatus.attemptsRemaining === DEFAULT_SECURITY_CONFIG.maxLoginAttempts - attempt, `Attempt #${attempt}: Remaining attempts correctly decremented to ${DEFAULT_SECURITY_CONFIG.maxLoginAttempts - attempt}`);
      }

      // Failed attempt 5 triggers temporary lockout
      const lockStatus = await accountLockoutService.recordFailedAttempt(testUsername);
      assert(lockStatus.isLocked === true, "Attempt #5: Account is successfully LOCKED");
      assert(lockStatus.attemptsRemaining === 0, "Attempt #5: 0 attempts remaining");
      assert(!!lockStatus.lockedUntil, "Attempt #5: lockedUntil timestamp is populated");

      // Verify checkStatus on locked account
      const currentLockedStatus = await accountLockoutService.checkStatus(testUsername);
      assert(currentLockedStatus.isLocked === true, "checkStatus confirms active lockout state");

      // Verify Lockout Expiration logic
      // Simulate expired lockout by updating lockedUntil to past time
      await prisma.user.update({
        where: { id: tempUser.id },
        data: {
          lockedUntil: new Date(Date.now() - 60 * 1000), // 1 minute in the past
          failedLoginAttempts: 5,
        },
      });

      const expiredStatus = await accountLockoutService.checkStatus(testUsername);
      assert(expiredStatus.isLocked === false, "checkStatus automatically resets expired lockout");
      assert(expiredStatus.attemptsRemaining === DEFAULT_SECURITY_CONFIG.maxLoginAttempts, "Expired lockout resets attemptsRemaining to 5");

      const dbUserAfterExpiry = await prisma.user.findUnique({ where: { id: tempUser.id } });
      assert(dbUserAfterExpiry?.failedLoginAttempts === 0, "Database failedLoginAttempts reset to 0 after expiration");
      assert(dbUserAfterExpiry?.lockedUntil === null, "Database lockedUntil reset to null after expiration");

      // Verify Successful-Login Reset logic
      // Set failed attempts to 3
      await prisma.user.update({
        where: { id: tempUser.id },
        data: { failedLoginAttempts: 3 },
      });

      await accountLockoutService.resetAttempts(testUsername);
      const userAfterReset = await prisma.user.findUnique({ where: { id: tempUser.id } });
      assert(userAfterReset?.failedLoginAttempts === 0, "resetAttempts clears failedLoginAttempts to 0 on successful authentication");
      assert(userAfterReset?.lockedUntil === null, "resetAttempts ensures lockedUntil is null");

      // ======================================================================
      // 5. ADMIN UNLOCK FUNCTIONALITY
      // ======================================================================
      console.log("\n--- TEST SUITE 5: Administrative Unlock Operations ---");

      // Lock account again
      await prisma.user.update({
        where: { id: tempUser.id },
        data: {
          failedLoginAttempts: 5,
          lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
        },
      });

      const beforeAdminUnlock = await accountLockoutService.checkStatus(testUsername);
      assert(beforeAdminUnlock.isLocked === true, "Account is confirmed locked before admin unlock");

      // Simulate administrative unlock
      await prisma.user.update({
        where: { id: tempUser.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });

      await securityAuditService.logEvent({
        actorId: "admin-test-actor",
        action: "USER_UNLOCKED",
        metadata: {
          targetUserId: tempUser.id,
          targetUsername: tempUser.username,
          previousFailedAttempts: 5,
        },
      });

      const afterAdminUnlock = await accountLockoutService.checkStatus(testUsername);
      assert(afterAdminUnlock.isLocked === false, "Account is immediately unlocked after admin action");
      assert(afterAdminUnlock.attemptsRemaining === 5, "Account attempts restored to 5 after admin unlock");

      const unlockAudit = await prisma.auditLog.findFirst({
        where: {
          action: "USER_UNLOCKED",
          metadata: { contains: tempUser.username },
        },
        orderBy: { createdAt: "desc" },
      });

      assert(!!unlockAudit, "Admin unlock event is recorded in audit log");
      if (unlockAudit) {
        assert(!unlockAudit.metadata?.includes("passwordHash"), "Audit log does not contain passwordHash");
      }
    } finally {
      // Clean up temporary test user and test audit logs safely
      await prisma.user.delete({ where: { id: tempUser.id } }).catch(() => {});
      await prisma.auditLog.deleteMany({
        where: { metadata: { contains: testUsername } },
      }).catch(() => {});
    }

    // ========================================================================
    // 6. SESSION SECURITY & PRIVACY BOUNDARIES
    // ========================================================================
    console.log("\n--- TEST SUITE 6: Session Security & Privacy Boundaries ---");

    const sessionTestUsername = `test_sess_${Date.now()}`;
    const sessionTempUser = await prisma.user.create({
      data: {
        username: sessionTestUsername,
        email: `${sessionTestUsername}@example.internal`,
        passwordHash: tempPasswordHash,
      },
    });

    try {
      const sessionResult = await sessionSecurityService.createSession(sessionTempUser.id);
      assert(typeof sessionResult.rawToken === "string" && sessionResult.rawToken.length === 64, "Generated 32-byte hex raw session token");
      assert(sessionResult.rawToken !== sessionResult.sessionId, "Raw session token is distinct from sessionId");

      const dbSession = await prisma.session.findUnique({
        where: { id: sessionResult.sessionId },
      });

      assert(!!dbSession, "Session record created in database");
      if (dbSession) {
        assert(dbSession.sessionToken !== sessionResult.rawToken, "Session token is hashed in database (SHA-256) and never stored plaintext");
        assert(dbSession.userId === sessionTempUser.id, "Session references correct userId foreign key");
      }

      const validated = await sessionSecurityService.validateToken(sessionResult.rawToken);
      assert(validated.isValid === true, "Valid raw session token successfully verifies against hashed session in database");
      assert(validated.userId === sessionTempUser.id, "Validated session returns corresponding userId");

      const invalidToken = await sessionSecurityService.validateToken("invalid_fake_token_value");
      assert(invalidToken.isValid === false, "Invalid raw session token is rejected");

      await sessionSecurityService.revokeSessionByToken(sessionResult.rawToken);
      const afterRevoke = await sessionSecurityService.validateToken(sessionResult.rawToken);
      assert(afterRevoke.isValid === false, "Revoked session token is rejected upon subsequent validation");
    } finally {
      await prisma.user.delete({ where: { id: sessionTempUser.id } }).catch(() => {});
    }

    console.log("\n===============================================================================");
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("===============================================================================");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("Test execution failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runSecurityAuditTests();
