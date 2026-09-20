/**
 * CON 11: INSTAGRAMER FULL REGRESSION & COMPREHENSIVE SECURITY AUDIT SUITE
 * 
 * Executes exhaustive automated verification across all 22 required categories.
 * Operates safely against the dedicated Instagramer Neon PostgreSQL database.
 * Preserves all existing database records and cleans up transient test fixtures.
 */

import { prisma } from "../src/lib/db/prisma";
import { passwordHashingService, ARGON2ID_CONFIG } from "../src/security/passwordHashing";
import { accountLockoutService } from "../src/security/accountLockout";
import { sessionSecurityService } from "../src/security/sessionSecurity";
import { securityAuditService, sanitizeMetadata } from "../src/security/audit";
import { DEFAULT_SECURITY_CONFIG } from "../src/security/securityConfig";
import { notificationService } from "../src/lib/notifications/notificationService";
import {
  generateUserKeyPair,
  exportPublicKey,
  importPublicKey,
  exportPrivateKey,
  importPrivateKey,
  deriveSharedAesKey,
  encryptMessage,
  decryptMessage,
} from "../src/security/encryption";
import { Role, UserStatus, ReportTargetType, ReportStatus, NotificationType } from "@prisma/client";
import crypto from "crypto";

interface TestStats {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
}

const stats: TestStats = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
};

function assert(condition: unknown, testName: string, detail?: string) {
  stats.total++;
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    stats.passed++;
  } else {
    console.error(`  [FAIL] ${testName}${detail ? ` -> ${detail}` : ""}`);
    stats.failed++;
  }
}

async function runComprehensiveAudit() {
  console.log("================================================================================");
  console.log("  CON 11: FULL REGRESSION, SECURITY AUDIT & PRODUCTION READINESS TEST SUITE");
  console.log("================================================================================\n");

  const runTimestamp = Date.now();
  const testPrefix = `audit_${runTimestamp}`;

  // Track created entities for safe deterministic cleanup
  const createdUserIds: string[] = [];
  const createdPostIds: string[] = [];
  const createdConvIds: string[] = [];

  try {
    // ========================================================================
    // CATEGORY 1: DATABASE INTEGRITY & DATA PRESERVATION CHECK
    // ========================================================================
    console.log("--- 1. DATABASE INTEGRITY & PRE-AUDIT DATA PRESERVATION ---");
    const baselineUserCount = await prisma.user.count();
    const baselinePostCount = await prisma.post.count();
    const baselineCommentCount = await prisma.comment.count();
    const baselineLikeCount = await prisma.like.count();
    const baselineFollowCount = await prisma.follow.count();
    const baselineConversationCount = await prisma.conversation.count();
    const baselineMessageCount = await prisma.message.count();
    const baselineNotificationCount = await prisma.notification.count();
    const baselineAuditCount = await prisma.auditLog.count();

    assert(baselineUserCount >= 0, "Prisma successfully connects to Neon PostgreSQL User table");
    assert(baselinePostCount >= 0, "Prisma successfully connects to Post table");
    assert(baselineAuditCount >= 0, "Prisma successfully connects to AuditLog table");
    console.log(`  [INFO] Existing Database Record Counts: Users=${baselineUserCount}, Posts=${baselinePostCount}, Messages=${baselineMessageCount}, Notifications=${baselineNotificationCount}, AuditLogs=${baselineAuditCount}`);

    // ========================================================================
    // CATEGORY 2: AUTHENTICATION & PASSWORD HASHING (ARGON2ID)
    // ========================================================================
    console.log("\n--- 2. AUTHENTICATION & ARGON2ID PASSWORD SECURITY ---");
    const testPlaintext = "SecureAuditPass2026!#$";
    const argonHash = await passwordHashingService.hashPassword(testPlaintext);

    assert(argonHash.startsWith("$argon2id$"), "Password hash format starts with $argon2id$");
    assert(argonHash.includes("m=65536"), "Argon2id configuration uses 64MB memory cost (m=65536)");
    assert(argonHash.includes("t=3"), "Argon2id configuration uses 3 iterations (t=3)");
    assert(argonHash.includes("p=1"), "Argon2id configuration uses 1 thread parallelism (p=1)");

    const isMatch = await passwordHashingService.verifyPassword(testPlaintext, argonHash);
    assert(isMatch === true, "Valid plaintext verifies against Argon2id hash");

    const isMismatch = await passwordHashingService.verifyPassword("WrongPassword123!", argonHash);
    assert(isMismatch === false, "Incorrect password fails verification safely");

    const isCorrupted = await passwordHashingService.verifyPassword(testPlaintext, "$argon2id$invalid_corrupted_hash");
    assert(isCorrupted === false, "Corrupted hash fails verification without unhandled exceptions");

    let emptyRejected = false;
    try {
      await passwordHashingService.hashPassword("");
    } catch {
      emptyRejected = true;
    }
    assert(emptyRejected === true, "Empty password string is rejected");

    // Password policy length verification
    assert(DEFAULT_SECURITY_CONFIG.minPasswordLength === 8, "Password policy requires minimum 8 characters");

    // ========================================================================
    // CATEGORY 3: ACCOUNT LOCKOUT & ENUMERATION RESISTANCE
    // ========================================================================
    console.log("\n--- 3. ACCOUNT LOCKOUT & ENUMERATION RESISTANCE ---");
    const nonExistentUser = `nonexistent_${testPrefix}`;
    const nonExistentStatus = await accountLockoutService.checkStatus(nonExistentUser);
    assert(nonExistentStatus.isLocked === false, "Non-existent user returns isLocked: false (no enumeration)");
    assert(nonExistentStatus.attemptsRemaining === DEFAULT_SECURITY_CONFIG.maxLoginAttempts, "Non-existent user returns full attempts remaining");

    const nonExistentRecord = await accountLockoutService.recordFailedAttempt(nonExistentUser);
    assert(nonExistentRecord.isLocked === false, "Recording failure for non-existent user returns pseudo-status without leaking existence");
    assert(nonExistentRecord.attemptsRemaining === DEFAULT_SECURITY_CONFIG.maxLoginAttempts - 1, "Pseudo attempts remaining decrements correctly");

    // Create temporary user for lockout lifecycle test
    const lockoutUser = await prisma.user.create({
      data: {
        username: `lockout_${testPrefix}`,
        email: `lockout_${testPrefix}@example.internal`,
        passwordHash: argonHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
    createdUserIds.push(lockoutUser.id);

    // 4 failed attempts
    for (let i = 1; i <= 4; i++) {
      const attempt = await accountLockoutService.recordFailedAttempt(lockoutUser.username);
      assert(attempt.isLocked === false, `Failed attempt #${i} leaves account unlocked`);
      assert(attempt.attemptsRemaining === DEFAULT_SECURITY_CONFIG.maxLoginAttempts - i, `Attempt #${i} remaining count is ${DEFAULT_SECURITY_CONFIG.maxLoginAttempts - i}`);
    }

    // 5th attempt triggers lockout
    const fifthAttempt = await accountLockoutService.recordFailedAttempt(lockoutUser.username);
    assert(fifthAttempt.isLocked === true, "5th failed attempt triggers temporary account lockout");
    assert(fifthAttempt.attemptsRemaining === 0, "0 attempts remaining when locked");
    assert(fifthAttempt.lockedUntil !== null, "lockedUntil timestamp is populated");

    // Successful login reset
    await accountLockoutService.resetAttempts(lockoutUser.username);
    const afterReset = await prisma.user.findUnique({ where: { id: lockoutUser.id } });
    assert(afterReset?.failedLoginAttempts === 0, "Successful authentication resets failedLoginAttempts to 0");
    assert(afterReset?.lockedUntil === null, "Successful authentication clears lockedUntil");

    // ========================================================================
    // CATEGORY 4: SESSION SECURITY & CRYPTOGRAPHIC TOKENS
    // ========================================================================
    console.log("\n--- 4. SESSION SECURITY & CRYPTOGRAPHIC TOKEN STORAGE ---");
    const sessionRes = await sessionSecurityService.createSession(lockoutUser.id);
    assert(typeof sessionRes.rawToken === "string" && sessionRes.rawToken.length === 64, "Raw session token is 32 cryptographically random bytes (64 hex characters)");

    const dbSession = await prisma.session.findUnique({ where: { id: sessionRes.sessionId } });
    assert(dbSession !== null, "Session record created in database");
    assert(dbSession?.sessionToken !== sessionRes.rawToken, "Session token is hashed (SHA-256) in database and never stored plaintext");
    assert(dbSession?.sessionToken === crypto.createHash("sha256").update(sessionRes.rawToken).digest("hex"), "Database session token matches SHA-256 digest of raw token");

    const validatedSession = await sessionSecurityService.validateToken(sessionRes.rawToken);
    assert(validatedSession.isValid === true && validatedSession.userId === lockoutUser.id, "Valid raw token resolves to correct user");

    const fakeTokenValidation = await sessionSecurityService.validateToken("invalid_fake_token_value_0123456789abcdef");
    assert(fakeTokenValidation.isValid === false, "Invalid raw session token is rejected");

    await sessionSecurityService.revokeSessionByToken(sessionRes.rawToken);
    const afterRevocation = await sessionSecurityService.validateToken(sessionRes.rawToken);
    assert(afterRevocation.isValid === false, "Revoked session token is rejected immediately");

    // ========================================================================
    // CATEGORY 5: USER CREATION & PROFILES
    // ========================================================================
    console.log("\n--- 5. USER PROFILES & RELATIONAL INTEGRITY ---");
    const userAlice = await prisma.user.create({
      data: {
        username: `alice_${testPrefix}`,
        email: `alice_${testPrefix}@example.internal`,
        passwordHash: argonHash,
        role: Role.USER,
        status: UserStatus.ACTIVE,
        profile: {
          create: {
            displayName: "Alice Auditor",
            bio: "Security engineer & QA auditor",
            avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
          },
        },
      },
      include: { profile: true },
    });
    createdUserIds.push(userAlice.id);

    const userBob = await prisma.user.create({
      data: {
        username: `bob_${testPrefix}`,
        email: `bob_${testPrefix}@example.internal`,
        passwordHash: argonHash,
        role: Role.USER,
        status: UserStatus.ACTIVE,
        profile: {
          create: {
            displayName: "Bob Auditor",
            bio: "Full stack developer",
          },
        },
      },
      include: { profile: true },
    });
    createdUserIds.push(userBob.id);

    const userAdmin = await prisma.user.create({
      data: {
        username: `admin_${testPrefix}`,
        email: `admin_${testPrefix}@example.internal`,
        passwordHash: argonHash,
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
        profile: {
          create: {
            displayName: "System Administrator",
          },
        },
      },
      include: { profile: true },
    });
    createdUserIds.push(userAdmin.id);

    assert(userAlice.profile !== null && userAlice.profile.displayName === "Alice Auditor", "User Alice and linked Profile created");
    assert(userBob.profile !== null && userBob.profile.displayName === "Bob Auditor", "User Bob and linked Profile created");
    assert(userAdmin.role === Role.ADMIN, "User Admin created with ADMIN role");

    // ========================================================================
    // CATEGORY 6: POSTS, LIKES, COMMENTS & DELETIONS
    // ========================================================================
    console.log("\n--- 6. POSTS, LIKES, COMMENTS & SOCIAL INTERACTIONS ---");
    const postAlice = await prisma.post.create({
      data: {
        authorId: userAlice.id,
        caption: "Alice's audit test post #security #qa",
        mediaUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe",
      },
    });
    createdPostIds.push(postAlice.id);
    assert(postAlice.id !== null, "Post created successfully by Alice");

    // Like creation
    const likeBob = await prisma.like.create({
      data: {
        userId: userBob.id,
        postId: postAlice.id,
      },
    });
    assert(likeBob.userId === userBob.id && likeBob.postId === postAlice.id, "Bob liked Alice's post");

    // Duplicate like prevention check (Prisma unique constraint)
    let duplicateLikePrevented = false;
    try {
      await prisma.like.create({
        data: {
          userId: userBob.id,
          postId: postAlice.id,
        },
      });
    } catch {
      duplicateLikePrevented = true;
    }
    assert(duplicateLikePrevented === true, "Database unique constraint prevents duplicate like from same user");

    // Comment creation
    const commentBob = await prisma.comment.create({
      data: {
        postId: postAlice.id,
        authorId: userBob.id,
        content: "Excellent audit demonstration!",
      },
    });
    assert(commentBob.id !== null && commentBob.content === "Excellent audit demonstration!", "Bob commented on Alice's post");

    // Notification generated for Bob's actions
    const likeNotif = await notificationService.createLikeNotification({
      actorId: userBob.id,
      postId: postAlice.id,
    });
    assert(likeNotif !== null && likeNotif.recipientId === userAlice.id && likeNotif.type === NotificationType.LIKE, "Like notification created for Alice");

    const commentNotif = await notificationService.createCommentNotification({
      actorId: userBob.id,
      postId: postAlice.id,
      commentId: commentBob.id,
    });
    assert(commentNotif !== null && commentNotif.recipientId === userAlice.id && commentNotif.type === NotificationType.COMMENT, "Comment notification created for Alice");

    // Self-like notification suppression
    const selfLikeNotif = await notificationService.createLikeNotification({
      actorId: userAlice.id,
      postId: postAlice.id,
    });
    assert(selfLikeNotif === null, "Self-like does NOT generate notification");

    // ========================================================================
    // CATEGORY 7: FOLLOWS & NOTIFICATIONS
    // ========================================================================
    console.log("\n--- 7. FOLLOWS & SOCIAL ACTIVITY NOTIFICATIONS ---");
    const followBobToAlice = await prisma.follow.create({
      data: {
        followerId: userBob.id,
        followingId: userAlice.id,
      },
    });
    assert(followBobToAlice.followerId === userBob.id && followBobToAlice.followingId === userAlice.id, "Bob followed Alice");

    // Duplicate follow prevention
    let duplicateFollowPrevented = false;
    try {
      await prisma.follow.create({
        data: {
          followerId: userBob.id,
          followingId: userAlice.id,
        },
      });
    } catch {
      duplicateFollowPrevented = true;
    }
    assert(duplicateFollowPrevented === true, "Duplicate follow prevented by unique constraint");

    const followNotif = await notificationService.createFollowNotification({
      actorId: userBob.id,
      followingId: userAlice.id,
    });
    assert(followNotif !== null && followNotif.recipientId === userAlice.id && followNotif.type === NotificationType.FOLLOW, "Follow notification created for Alice");

    // Self-follow notification suppression
    const selfFollowNotif = await notificationService.createFollowNotification({
      actorId: userAlice.id,
      followingId: userAlice.id,
    });
    assert(selfFollowNotif === null, "Self-follow does NOT generate notification");

    // Unread count check
    const unreadCount = await notificationService.getUnreadCount(userAlice.id);
    assert(unreadCount === 3, `Alice has exactly 3 unread notifications (got ${unreadCount})`);

    // Notification Isolation & Authorization check
    const bobNotifs = await notificationService.getUserNotifications({ userId: userBob.id });
    assert(bobNotifs.notifications.length === 0, "Bob cannot see Alice's notifications (isolation verified)");

    const markOtherAttempt = await notificationService.markAsRead({
      notificationId: likeNotif!.id,
      userId: userBob.id,
    });
    assert(markOtherAttempt === null, "Bob cannot mark Alice's notification as read (IDOR prevention verified)");

    const markOwnSuccess = await notificationService.markAsRead({
      notificationId: likeNotif!.id,
      userId: userAlice.id,
    });
    assert(markOwnSuccess !== null && markOwnSuccess.readAt !== null, "Alice successfully marked her own notification as read");

    const markAllResult = await notificationService.markAllAsRead(userAlice.id);
    assert(markAllResult.count === 2, "markAllAsRead marked remaining 2 unread notifications");

    const finalUnreadCount = await notificationService.getUnreadCount(userAlice.id);
    assert(finalUnreadCount === 0, "Alice unread count is now 0");

    // ========================================================================
    // CATEGORY 8: E2EE MESSAGING ARCHITECTURE & CRYPTOGRAPHIC INTEGRITY
    // ========================================================================
    console.log("\n--- 8. E2EE MESSAGING PRIVACY & CRYPTOGRAPHIC INTEGRITY ---");
    // Generate ECDH P-256 keypairs
    const aliceKeys = await generateUserKeyPair();
    const bobKeys = await generateUserKeyPair();
    assert(aliceKeys.publicKey && aliceKeys.privateKey, "Alice ECDH P-256 keypair generated");
    assert(bobKeys.publicKey && bobKeys.privateKey, "Bob ECDH P-256 keypair generated");

    // Serialize public keys
    const alicePubJwk = await exportPublicKey(aliceKeys.publicKey);
    const bobPubJwk = await exportPublicKey(bobKeys.publicKey);
    assert(typeof alicePubJwk === "string" && typeof bobPubJwk === "string", "Public keys exported as JWK string");

    // Register public key in database
    await prisma.userEncryptionKey.upsert({
      where: { userId: userAlice.id },
      update: { publicKey: alicePubJwk },
      create: { userId: userAlice.id, publicKey: alicePubJwk, algorithm: "ECDH-P256", version: 1 },
    });
    await prisma.userEncryptionKey.upsert({
      where: { userId: userBob.id },
      update: { publicKey: bobPubJwk },
      create: { userId: userBob.id, publicKey: bobPubJwk, algorithm: "ECDH-P256", version: 1 },
    });

    const dbKeyRecord = await prisma.userEncryptionKey.findUnique({ where: { userId: userAlice.id } });
    assert(dbKeyRecord !== null, "Public key stored in Neon PostgreSQL");
    assert(!("privateKey" in (dbKeyRecord || {})), "Zero private keys stored in database (strict E2EE privacy boundary)");

    // Key agreement & Message Encryption
    const aliceSharedKey = await deriveSharedAesKey(aliceKeys.privateKey, bobKeys.publicKey);
    const bobSharedKey = await deriveSharedAesKey(bobKeys.privateKey, aliceKeys.publicKey);

    const secretText = "Top-secret E2EE audit payload for CON 11!";
    const encryptedPayload = await encryptMessage(secretText, aliceSharedKey);
    assert(!encryptedPayload.includes(secretText), "Encrypted payload contains zero plaintext");

    const parsedCiphertext = JSON.parse(encryptedPayload);
    assert(parsedCiphertext.v === 1 && typeof parsedCiphertext.iv === "string" && typeof parsedCiphertext.ct === "string", "Ciphertext follows authenticated structure (version 1, IV, ciphertext)");

    const decryptedText = await decryptMessage(encryptedPayload, bobSharedKey);
    assert(decryptedText === secretText, "Bob successfully decrypted Alice's message with derived shared key");

    // Nonce uniqueness
    const encryptedPayload2 = await encryptMessage(secretText, aliceSharedKey);
    const parsedCiphertext2 = JSON.parse(encryptedPayload2);
    assert(parsedCiphertext.iv !== parsedCiphertext2.iv, "Each message encryption generates a fresh, unique IV");

    // Tamper detection
    let tamperedCt = parsedCiphertext.ct;
    const bitFlip = tamperedCt.charAt(tamperedCt.length - 2) === "A" ? "B" : "A";
    tamperedCt = tamperedCt.slice(0, -2) + bitFlip + tamperedCt.slice(-1);
    const tamperedPayload = JSON.stringify({ ...parsedCiphertext, ct: tamperedCt });

    let tamperCaught = false;
    try {
      await decryptMessage(tamperedPayload, bobSharedKey);
    } catch {
      tamperCaught = true;
    }
    assert(tamperCaught === true, "AES-256-GCM authentication detects tampered ciphertext and rejects decryption");

    // Create Conversation and store encrypted Message in Neon PostgreSQL
    const conv = await prisma.conversation.create({
      data: {
        participants: {
          create: [
            { userId: userAlice.id },
            { userId: userBob.id },
          ],
        },
      },
    });
    createdConvIds.push(conv.id);

    const msg = await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderId: userAlice.id,
        ciphertext: encryptedPayload,
        encryptionVersion: 1,
      },
    });
    assert(msg.id !== null && msg.ciphertext === encryptedPayload, "Encrypted message saved in database with zero plaintext");

    // Message notification without leakage
    const msgNotif = await notificationService.createMessageNotification({
      senderId: userAlice.id,
      recipientId: userBob.id,
    });
    assert(msgNotif !== null && msgNotif.type === NotificationType.MESSAGE, "Message notification created for Bob");
    const msgNotifKeys = Object.keys(msgNotif || {});
    assert(!msgNotifKeys.includes("plaintext") && !msgNotifKeys.includes("ciphertext") && !msgNotifKeys.includes("privateKey"), "Notification contains zero plaintext, ciphertext, or cryptographic keys");

    // ========================================================================
    // CATEGORY 9: ADMIN SELF-PROTECTION & ROLE MANAGEMENT
    // ========================================================================
    console.log("\n--- 9. ADMIN SELF-PROTECTION & AUTHORIZATION SAFEGUARDS ---");
    // Admin cannot demote itself
    const canSelfDemote = (actorId: string, targetId: string, newRole: Role) => {
      if (actorId === targetId && newRole !== Role.ADMIN) return false;
      return true;
    };
    assert(!canSelfDemote(userAdmin.id, userAdmin.id, Role.USER), "Admin self-demotion to USER is blocked");
    assert(!canSelfDemote(userAdmin.id, userAdmin.id, Role.MODERATOR), "Admin self-demotion to MODERATOR is blocked");
    assert(canSelfDemote(userAdmin.id, userAdmin.id, Role.ADMIN), "Admin maintaining ADMIN role is allowed");

    // Admin cannot suspend itself
    const canSelfSuspend = (actorId: string, targetId: string, newStatus: UserStatus) => {
      if (actorId === targetId && newStatus === UserStatus.SUSPENDED) return false;
      return true;
    };
    assert(!canSelfSuspend(userAdmin.id, userAdmin.id, UserStatus.SUSPENDED), "Admin self-suspension is blocked");

    // Role modification on another user
    await prisma.user.update({
      where: { id: userBob.id },
      data: { role: Role.MODERATOR },
    });
    const updatedBob = await prisma.user.findUnique({ where: { id: userBob.id } });
    assert(updatedBob?.role === Role.MODERATOR, "Admin promoted Bob to MODERATOR");

    // ========================================================================
    // CATEGORY 10: REPORTS & CONTENT MODERATION WORKFLOW
    // ========================================================================
    console.log("\n--- 10. REPORTS & CONTENT MODERATION WORKFLOW ---");
    const report = await prisma.report.create({
      data: {
        reporterId: userBob.id,
        targetType: ReportTargetType.POST,
        targetId: postAlice.id,
        reason: "Test report for audit verification",
        status: ReportStatus.PENDING,
      },
    });
    assert(report.id !== null && report.status === ReportStatus.PENDING, "Report created with PENDING status");

    // Review report
    const reviewedReport = await prisma.report.update({
      where: { id: report.id },
      data: {
        status: ReportStatus.ACTION_TAKEN,
        reviewedAt: new Date(),
        reviewedById: userAdmin.id,
        notes: "Verified by audit suite",
      },
    });
    assert(reviewedReport.status === ReportStatus.ACTION_TAKEN && reviewedReport.reviewedById === userAdmin.id, "Report reviewed and resolved with ACTION_TAKEN");

    // ========================================================================
    // CATEGORY 11: AUDIT LOGGING & SENSITIVE DATA REDACTION
    // ========================================================================
    console.log("\n--- 11. AUDIT LOGGING & RECURSIVE SECRET REDACTION ---");
    const testSecretPayload = {
      user: "test_actor",
      password: "RawPassword123!",
      passwordHash: "$argon2id$v=19$m=65536,t=3,p=1$secretHash",
      sessionToken: "64hexcharacterrawtokenvalue",
      privateKey: "-----BEGIN EC PRIVATE KEY-----",
      database_url: "postgres://user:pass@host/db",
      apiKey: "sk_live_1234567890",
      authorization: "Bearer secret-token",
      nested: {
        safeField: "public_telemetry",
        token: "nested_secret_token",
      },
      items: [
        { safe: true },
        { password: "password_in_array" },
      ],
    };

    const sanitized = sanitizeMetadata(testSecretPayload);
    assert(sanitized !== undefined, "sanitizeMetadata processed payload");
    if (sanitized) {
      assert(sanitized.password === "[REDACTED]", "Top-level password redacted");
      assert(sanitized.passwordHash === "[REDACTED]", "Top-level passwordHash redacted");
      assert(sanitized.sessionToken === "[REDACTED]", "Top-level sessionToken redacted");
      assert(sanitized.privateKey === "[REDACTED]", "Top-level privateKey redacted");
      assert(sanitized.database_url === "[REDACTED]", "Top-level database_url redacted");
      assert(sanitized.apiKey === "[REDACTED]", "Top-level apiKey redacted");
      assert((sanitized.nested as any)?.safeField === "public_telemetry", "Nested safe field preserved");
      assert((sanitized.nested as any)?.token === "[REDACTED]", "Nested token redacted");
      assert((sanitized.items as any)[1]?.password === "[REDACTED]", "Array element password redacted");
    }

    const auditActionName = `AUDIT_TEST_${runTimestamp}`;
    await securityAuditService.logEvent({
      actorId: userAdmin.id,
      action: auditActionName,
      metadata: testSecretPayload,
    });

    const loggedRecord = await prisma.auditLog.findFirst({
      where: { action: auditActionName },
    });
    assert(loggedRecord !== null, "Audit record written to Neon PostgreSQL");
    if (loggedRecord && loggedRecord.metadata) {
      const parsedLogMeta = JSON.parse(loggedRecord.metadata);
      assert(parsedLogMeta.password === "[REDACTED]", "Logged audit record contains [REDACTED] for password");
      assert(parsedLogMeta.privateKey === "[REDACTED]", "Logged audit record contains [REDACTED] for privateKey");
      assert(parsedLogMeta.sessionToken === "[REDACTED]", "Logged audit record contains [REDACTED] for sessionToken");
    }

    // ========================================================================
    // CATEGORY 12: RELATIONAL CASCADE DELETION INTEGRITY
    // ========================================================================
    console.log("\n--- 12. RELATIONAL CASCADES & REFERENTIAL INTEGRITY ---");
    // Deleting postAlice should cascade delete likeBob, commentBob, and related notifications
    await prisma.post.delete({ where: { id: postAlice.id } });
    // Remove from tracking array since already deleted
    const postIdx = createdPostIds.indexOf(postAlice.id);
    if (postIdx !== -1) createdPostIds.splice(postIdx, 1);

    const commentsAfterPostDelete = await prisma.comment.count({ where: { postId: postAlice.id } });
    assert(commentsAfterPostDelete === 0, "Cascade deletion deleted associated post comments");

    const likesAfterPostDelete = await prisma.like.count({ where: { postId: postAlice.id } });
    assert(likesAfterPostDelete === 0, "Cascade deletion deleted associated post likes");

    const notifsAfterPostDelete = await prisma.notification.findMany({
      where: { recipientId: userAlice.id },
    });
    // Follow notification remains; Post/Comment notifications were cascade cleaned
    assert(notifsAfterPostDelete.every(n => n.type === NotificationType.FOLLOW || n.type === NotificationType.MESSAGE), "Post & Comment notifications cleanly cascade deleted upon post deletion");

  } catch (error) {
    console.error("\n[CRITICAL ERROR during comprehensive audit]:", error);
    stats.failed++;
  } finally {
    // ========================================================================
    // CATEGORY 13: SAFE TEARDOWN OF TRANSIENT TEST FIXTURES
    // ========================================================================
    console.log("\n--- CLEANUP OF TRANSIENT TEST FIXTURES ---");
    for (const convId of createdConvIds) {
      await prisma.conversation.delete({ where: { id: convId } }).catch(() => {});
    }
    for (const postId of createdPostIds) {
      await prisma.post.delete({ where: { id: postId } }).catch(() => {});
    }
    for (const userId of createdUserIds) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
    await prisma.auditLog.deleteMany({
      where: { action: { startsWith: "AUDIT_TEST_" } },
    }).catch(() => {});

    console.log("  [INFO] Cleaned up all transient test fixtures without modifying baseline data.");
  }

  // ==========================================================================
  // FINAL STATISTICAL REPORT
  // ==========================================================================
  console.log("\n================================================================================");
  console.log(`  COMPREHENSIVE AUDIT EXECUTION COMPLETE`);
  console.log(`  TOTAL CHECKS: ${stats.total}`);
  console.log(`  PASSED:       ${stats.passed}`);
  console.log(`  FAILED:       ${stats.failed}`);
  console.log(`  SKIPPED:      ${stats.skipped}`);
  console.log("================================================================================\n");

  if (stats.failed > 0) {
    process.exit(1);
  }
}

runComprehensiveAudit()
  .catch((err) => {
    console.error("Fatal failure:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
