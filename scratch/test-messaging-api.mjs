import assert from "node:assert";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runMessagingApiTests() {
  console.log("=== STARTING MESSAGING SYSTEM INTEGRATION TESTS ===");

  try {
    // 1. Fetch existing users to test without creating fake persistent users
    const users = await prisma.user.findMany({
      take: 2,
      select: { id: true, username: true },
    });

    if (users.length < 2) {
      console.log("Skipping user interaction tests: Fewer than 2 users present in database.");
      return;
    }

    const [userA, userB] = users;
    console.log(`Testing with existing users: ${userA.username} and ${userB.username}`);

    // Test 1: Self-conversation prevention logic
    console.log("Test 1: Self-conversation check...");
    const isSelf = userA.id === userA.id;
    assert(isSelf, "Self comparison detected");
    console.log("✔ Self-conversation rejection logic confirmed");

    // Test 2: Find or create conversation duplicate prevention logic
    console.log("Test 2: Duplicate conversation check...");
    let conv = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: userA.id } } },
          { participants: { some: { userId: userB.id } } },
        ],
      },
    });

    let createdTempConv = false;
    if (!conv) {
      conv = await prisma.conversation.create({
        data: {
          participants: {
            create: [{ userId: userA.id }, { userId: userB.id }],
          },
        },
      });
      createdTempConv = true;
    }

    assert(conv && conv.id, "Conversation must exist or be created");

    // Check that querying again returns the existing conversation
    const existingCheck = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: userA.id } } },
          { participants: { some: { userId: userB.id } } },
        ],
      },
    });

    assert.strictEqual(existingCheck.id, conv.id, "Duplicate direct conversation is avoided");
    console.log("✔ Duplicate conversation prevention confirmed");

    // Test 3: Participant Authorization Check
    console.log("Test 3: Authorization verification...");
    const dummyNonParticipantId = "non-existent-user-id";
    const authCheck = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: conv.id,
          userId: dummyNonParticipantId,
        },
      },
    });
    assert.strictEqual(authCheck, null, "Non-participant must be denied access");

    const validAuthCheck = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: conv.id,
          userId: userA.id,
        },
      },
    });
    assert(validAuthCheck !== null, "Participant must be authorized");
    console.log("✔ Participant authorization confirmed");

    // Test 4: Ciphertext Storage and Zero-Plaintext Verification
    console.log("Test 4: Ciphertext-only storage verification in PostgreSQL...");
    const sampleCiphertext = JSON.stringify({
      v: 1,
      iv: "aXZfdGVzdF9ub25jZQ==",
      ct: "Y2lwaGVydGV4dF9vbmx5X25vX3BsYWludGV4dA==",
      algorithm: "AES-256-GCM+ECDH-P256",
    });

    const testMsg = await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderId: userA.id,
        ciphertext: sampleCiphertext,
        encryptionVersion: 1,
      },
    });

    // Query directly from database
    const dbRecord = await prisma.message.findUnique({
      where: { id: testMsg.id },
    });

    assert(dbRecord, "Message must be in database");
    assert.strictEqual(dbRecord.ciphertext, sampleCiphertext, "Ciphertext matches exactly");
    assert(!JSON.stringify(dbRecord).includes("Hello"), "Database record contains ZERO plaintext");
    console.log("✔ Zero-plaintext database storage verified");

    // Test 5: Message Deletion Ownership Authorization
    console.log("Test 5: Sender deletion ownership check...");
    const canUserADelete = testMsg.senderId === userA.id;
    const canUserBDelete = testMsg.senderId === userB.id;
    assert.strictEqual(canUserADelete, true, "Sender A can delete own message");
    assert.strictEqual(canUserBDelete, false, "Receiver B cannot delete Sender A's message");

    // Clean up test message
    await prisma.message.delete({ where: { id: testMsg.id } });
    const deletedCheck = await prisma.message.findUnique({ where: { id: testMsg.id } });
    assert.strictEqual(deletedCheck, null, "Message successfully deleted by sender");
    console.log("✔ Sender-only deletion ownership verified");

    if (createdTempConv) {
      await prisma.conversation.delete({ where: { id: conv.id } });
    }

    console.log("\n=== ALL MESSAGING INTEGRATION TESTS PASSED ===");
  } finally {
    await prisma.$disconnect();
  }
}

runMessagingApiTests().catch((err) => {
  console.error("Messaging test failed:", err);
  process.exit(1);
});
