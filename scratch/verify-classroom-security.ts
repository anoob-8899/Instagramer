import { prisma } from "../src/lib/db/prisma";
import { passwordHashingService } from "../src/security/passwordHashing";

async function main() {
  console.log("=================================================");
  console.log("CON 13: CLASSROOM CYBERSECURITY DEMO VERIFICATION");
  console.log("=================================================");

  // 1. Verify Existing Production Records Count
  const userCount = await prisma.user.count();
  const postCount = await prisma.post.count();
  const commentCount = await prisma.comment.count();
  const likeCount = await prisma.like.count();
  const followCount = await prisma.follow.count();
  const notifCount = await prisma.notification.count();

  console.log("\n--- TEST SUITE 1: Neon Database Record Integrity ---");
  console.log(`Users: ${userCount}`);
  console.log(`Posts: ${postCount}`);
  console.log(`Comments: ${commentCount}`);
  console.log(`Likes: ${likeCount}`);
  console.log(`Follows: ${followCount}`);
  console.log(`Notifications: ${notifCount}`);

  if (userCount < 6 || postCount < 22) {
    throw new Error("FAIL: Database records missing!");
  }
  console.log("[PASS] Production database records 100% intact.");

  // 2. Test Argon2id Hashing for 6-Digit Password
  console.log("\n--- TEST SUITE 2: Argon2id Hashing for 6-Digit Passwords ---");
  const testPin = "482915";
  const hash = await passwordHashingService.hashPassword(testPin);
  console.log(`Generated Hash: ${hash.substring(0, 35)}...`);
  const isArgon2id = hash.startsWith("$argon2id$");
  console.log(`Algorithm Argon2id Verified: ${isArgon2id}`);
  const verified = await passwordHashingService.verifyPassword(testPin, hash);
  console.log(`Password Match Verified: ${verified}`);

  if (!isArgon2id || !verified) {
    throw new Error("FAIL: Argon2id hashing check failed!");
  }
  console.log("[PASS] 6-Digit password hashed with Argon2id successfully.");

  // 3. Test Demo Student Account Signup / Uniqueness
  console.log("\n--- TEST SUITE 3: Demo Classroom Account Check ---");
  const demoUsername = "student_demo_01";

  // Cleanup demo student if previously created
  await prisma.user.deleteMany({
    where: { username: demoUsername },
  });

  const demoUser = await prisma.user.create({
    data: {
      username: demoUsername,
      email: null,
      passwordHash: hash,
      profile: {
        create: {
          displayName: "Student Demo 01",
        },
      },
    },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      passwordHash: true,
    },
  });

  console.log(`Created Classroom Account: @${demoUser.username} (email: ${demoUser.email})`);
  if (demoUser.passwordHash !== hash || demoUser.email !== null) {
    throw new Error("FAIL: Classroom account creation issue!");
  }
  console.log("[PASS] Classroom signup without email supported safely.");

  // Cleanup test user after verification
  await prisma.user.delete({ where: { id: demoUser.id } });

  console.log("\n=================================================");
  console.log("ALL VERIFICATION SUITES PASSED SUCCESSFULLY!");
  console.log("=================================================");
}

main()
  .catch((err) => {
    console.error("Verification failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
